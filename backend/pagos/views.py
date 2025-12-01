from datetime import date
import uuid
from datetime import datetime
from django.conf import settings
from django.http import HttpResponse
from django.urls import reverse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Sum, Q
from django.utils import timezone
from transbank.webpay.webpay_plus.transaction import Transaction
from transbank.common.integration_commerce_codes import IntegrationCommerceCodes
from transbank.common.integration_api_keys import IntegrationApiKeys
from transbank.common.options import WebpayOptions
from atletas.serializers import AtletaSerializer
from users.permissions import IsRoleAdmin
from .models import (
    PeriodoMatricula, Matricula, ConfiguracionMensualidad, Mensualidad, PagoManual, WebpayTransaction,
    PagoOnline, PagoOnlineObligacion, WebpayPagoOnlineTransaction, PaymentCard
)
from .serializers import (
    PeriodoMatriculaSerializer, MatriculaSerializer, ConfiguracionMensualidadSerializer,
    MensualidadSerializer, PagoManualSerializer, WebpayTransactionSerializer,
    PagoOnlineSerializer, PagoOnlineObligacionSerializer, WebpayPagoOnlineTransactionSerializer,
    PaymentCardSerializer
)
from finanzas.models import Egreso


def is_admin(user):
    return getattr(user, 'role', None) == 'admin'


def is_apoderado(user):
    return getattr(user, 'role', None) == 'apoderado'


class PeriodoMatriculaViewSet(viewsets.ModelViewSet):
    queryset = PeriodoMatricula.objects.all()
    serializer_class = PeriodoMatriculaSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class MatriculaViewSet(viewsets.ModelViewSet):
    queryset = Matricula.objects.select_related('atleta', 'periodo', 'apoderado')
    serializer_class = MatriculaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_admin(user):
            return qs
        return qs.filter(apoderado=user)

    def perform_create(self, serializer):
        serializer.save(apoderado=self.request.user)

    def create(self, request, *args, **kwargs):
        data = request.data
        atleta_id = data.get('atleta') or data.get('atleta_id')
        periodo_id = data.get('periodo') or data.get('periodo_id')

        periodo = None
        if periodo_id:
            try:
                periodo = PeriodoMatricula.objects.get(pk=periodo_id)
            except PeriodoMatricula.DoesNotExist:
                return Response({'detail': 'Periodo no encontrado'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            periodo = PeriodoMatricula.objects.filter(estado='activo').first()
            if not periodo:
                return Response({'detail': 'No hay periodo de matrícula activo'}, status=status.HTTP_400_BAD_REQUEST)

        from atletas.models import Atleta
        atleta_obj = None
        if atleta_id:
            try:
                atleta_obj = Atleta.objects.get(pk=atleta_id)
            except Atleta.DoesNotExist:
                return Response({'detail': 'Atleta no encontrado'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            rut = data.get('atleta_rut') or data.get('rut') or ''
            nombre = data.get('atleta_nombre') or ''
            fecha_nac = data.get('atleta_fecha_nacimiento') or data.get('fecha_nacimiento')
            division = data.get('division') or ''
            categoria = data.get('categoria') or data.get('nivel_cheer') or ''
            nivel = data.get('nivel') or 1
            telefono = data.get('telefono_contacto') or ''
            direccion = data.get('direccion') or ''
            if not rut or not nombre or not fecha_nac or not division:
                return Response({'detail': 'Faltan datos del atleta'}, status=status.HTTP_400_BAD_REQUEST)
            nombres = nombre
            apellidos = ''
            if ' ' in nombre:
                partes = nombre.split(' ', 1)
                nombres = partes[0]
                apellidos = partes[1]
            # Si el atleta existe con el mismo RUT, lo reasignamos al apoderado actual y actualizamos datos clave
            try:
                atleta_obj = Atleta.objects.get(rut=rut)
                if atleta_obj.apoderado != request.user:
                    atleta_obj.apoderado = request.user
                atleta_obj.nombres = nombres
                atleta_obj.apellidos = apellidos
                atleta_obj.fecha_nacimiento = fecha_nac
                atleta_obj.division = division
                atleta_obj.categoria = categoria or 'recreativo'
                atleta_obj.nivel = int(nivel) if str(nivel).isdigit() else 1
                atleta_obj.telefono_contacto = telefono
                atleta_obj.direccion = direccion
                atleta_obj.email_contacto = data.get('apoderado_email') or ''
                atleta_obj.contacto_emergencia = data.get('apoderado_nombre') or ''
                atleta_obj.telefono_emergencia = data.get('apoderado_telefono') or ''
                atleta_obj.save()
            except Atleta.DoesNotExist:
                atleta_obj = Atleta.objects.create(
                    rut=rut,
                    apoderado=request.user,
                    nombres=nombres,
                    apellidos=apellidos,
                    fecha_nacimiento=fecha_nac,
                    division=division,
                    categoria=categoria or 'recreativo',
                    nivel=int(nivel) if str(nivel).isdigit() else 1,
                    telefono_contacto=telefono,
                    direccion=direccion,
                    email_contacto=data.get('apoderado_email') or '',
                    contacto_emergencia=data.get('apoderado_nombre') or '',
                    telefono_emergencia=data.get('apoderado_telefono') or '',
                )

        # El monto siempre es el configurado en el periodo (evita valores manipulados desde el front)
        try:
            monto_val = float(periodo.monto)
        except Exception:
            return Response({'detail': 'Monto inválido'}, status=status.HTTP_400_BAD_REQUEST)
        matricula = Matricula.objects.create(
            atleta=atleta_obj,
            periodo=periodo,
            apoderado=request.user,
            monto_original=monto_val,
            descuento_aplicado=0,
            monto_total=monto_val,
            monto_pagado=0,
            estado_pago='pendiente',
            metodo_pago=data.get('metodo_pago') or 'webpay'
        )
        serializer = self.get_serializer(matricula)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'], url_path='mis-pagos')
    def mis_pagos(self, request):
        qs = self.get_queryset().filter(apoderado=request.user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class ConfiguracionMensualidadViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj, _ = ConfiguracionMensualidad.objects.get_or_create(id=1, defaults={
            'monto_base': 0,
            'dia_vencimiento': 5,
            'recargo_por_atraso': 0,
            'descuento_hermanos': 0,
            'activo': True,
        })
        return obj

    def list(self, request):
        serializer = ConfiguracionMensualidadSerializer(self.get_object())
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        if not is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object()
        serializer = ConfiguracionMensualidadSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MensualidadViewSet(viewsets.ModelViewSet):
    queryset = Mensualidad.objects.select_related('atleta', 'apoderado')
    serializer_class = MensualidadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_admin(user):
            return qs
        return qs.filter(apoderado=user)

    def perform_create(self, serializer):
        serializer.save(apoderado=self.request.user)


class PagoOnlineViewSet(viewsets.ModelViewSet):
    queryset = PagoOnline.objects.all()
    serializer_class = PagoOnlineSerializer
    permission_classes = [permissions.IsAuthenticated, IsRoleAdmin]

    def perform_create(self, serializer):
        pago = serializer.save()
        self._generar_obligaciones(pago)

    @action(detail=True, methods=['post'], url_path='generar-obligaciones')
    def generar_obligaciones(self, request, pk=None):
        pago = self.get_object()
        self._generar_obligaciones(pago, force=True)
        return Response({'detail': 'Obligaciones generadas'})

    def _generar_obligaciones(self, pago: PagoOnline, force: bool = False):
        from atletas.models import Atleta
        atletas = Atleta.objects.filter(activo=True).select_related('apoderado')
        obligaciones = []
        existentes = set()
        if not force:
            existentes = set(
                PagoOnlineObligacion.objects.filter(pago=pago).values_list('apoderado_id', 'atleta_id')
            )
        for atleta in atletas:
            key = (atleta.apoderado_id, atleta.id)
            if not force and key in existentes:
                continue
            obligaciones.append(PagoOnlineObligacion(
                pago=pago,
                apoderado=atleta.apoderado,
                atleta=atleta,
                monto=pago.monto,
                estado='pendiente',
            ))
        if obligaciones:
            # ignore_conflicts evita romper si ya existe una obligación para ese apoderado/atleta
            PagoOnlineObligacion.objects.bulk_create(obligaciones, ignore_conflicts=True)
            apoderados_ids = {ob.apoderado_id for ob in obligaciones if ob.apoderado_id}
            if apoderados_ids:
                autopay_cards = PaymentCard.objects.filter(user_id__in=apoderados_ids, autopay_enabled=True)
                for card in autopay_cards:
                    pendientes = PagoOnlineObligacion.objects.filter(
                        pago=pago,
                        apoderado=card.user,
                        estado='pendiente'
                    )
                    if pendientes.exists():
                        pendientes.update(
                            estado='pagado',
                            metodo_pago='tarjeta-autopago',
                            fecha_pago=timezone.now()
                        )


class PagoOnlineObligacionViewSet(viewsets.ModelViewSet):
    queryset = PagoOnlineObligacion.objects.select_related('pago', 'apoderado', 'atleta')
    serializer_class = PagoOnlineObligacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not is_admin(user):
            qs = qs.filter(apoderado=user)
        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)
        pago_id = self.request.query_params.get('pago')
        if pago_id:
            qs = qs.filter(pago_id=pago_id)
        return qs

    def partial_update(self, request, *args, **kwargs):
        obj = self.get_object()
        if not (is_admin(request.user) or obj.apoderado_id == request.user.id):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='pagar')
    def pagar(self, request, pk=None):
        obligacion = self.get_object()
        if not (is_admin(request.user) or obligacion.apoderado_id == request.user.id):
            return Response(status=status.HTTP_403_FORBIDDEN)
        obligacion.estado = 'pagado'
        obligacion.fecha_pago = timezone.now()
        obligacion.metodo_pago = request.data.get('metodo_pago') or 'manual'
        obligacion.save(update_fields=['estado', 'fecha_pago', 'metodo_pago'])
        return Response(self.get_serializer(obligacion).data)

    @action(detail=False, methods=['post'], url_path='autopagar')
    def autopagar(self, request):
        user = request.user
        if is_admin(user):
            return Response({'detail': 'Autopago solo para apoderados'}, status=status.HTTP_400_BAD_REQUEST)
        # Permite seleccionar tarjeta o usar default; si no hay autopay_enabled la activamos en el momento.
        card_id = request.data.get('card_id')
        card = None
        if card_id:
            card = PaymentCard.objects.filter(pk=card_id, user=user).first()
        if not card:
            card = PaymentCard.objects.filter(user=user, is_default=True).first()
        if not card:
            # Último recurso: primera tarjeta del usuario
            card = PaymentCard.objects.filter(user=user).first()
        if not card:
            return Response({'detail': 'No hay tarjeta guardada'}, status=status.HTTP_400_BAD_REQUEST)
        if not card.autopay_enabled:
            card.autopay_enabled = True
            card.save(update_fields=['autopay_enabled'])
        pendientes = PagoOnlineObligacion.objects.filter(apoderado=user, estado='pendiente')
        count = pendientes.count()
        for ob in pendientes:
            ob.estado = 'pagado'
            ob.metodo_pago = 'tarjeta-autopago'
            ob.fecha_pago = timezone.now()
        if count:
            PagoOnlineObligacion.objects.bulk_update(pendientes, ['estado', 'metodo_pago', 'fecha_pago'])
        data = self.get_serializer(pendientes, many=True).data
        return Response({'pagadas': count, 'obligaciones': data})

    @action(detail=True, methods=['post'], url_path='pagar-con-tarjeta')
    def pagar_con_tarjeta(self, request, pk=None):
        obligacion = self.get_object()
        if obligacion.estado == 'pagado':
            return Response({'detail': 'Obligacion ya pagada'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        if obligacion.apoderado_id != user.id and not is_admin(user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        card_id = request.data.get('card_id')
        try:
            if card_id:
                card = PaymentCard.objects.get(pk=card_id, user=user)
            else:
                card = PaymentCard.objects.filter(user=user, is_default=True).first()
        except PaymentCard.DoesNotExist:
            card = None
        if not card:
            return Response({'detail': 'No hay tarjeta guardada'}, status=status.HTTP_400_BAD_REQUEST)
        # Simulamos cargo exitoso; en producción se integraría Oneclick/recurring aquí.
        obligacion.estado = 'pagado'
        obligacion.metodo_pago = 'tarjeta-guardada'
        obligacion.fecha_pago = timezone.now()
        obligacion.save(update_fields=['estado', 'metodo_pago', 'fecha_pago'])
        data = self.get_serializer(obligacion).data
        return Response(data, status=status.HTTP_200_OK)


class PaymentCardViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentCardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentCard.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        is_default = serializer.validated_data.get('is_default', False)
        card = serializer.save(user=user)
        if is_default or not PaymentCard.objects.filter(user=user, is_default=True).exists():
            PaymentCard.objects.filter(user=user).exclude(pk=card.pk).update(is_default=False)
            card.is_default = True
            card.save(update_fields=['is_default'])

    def partial_update(self, request, *args, **kwargs):
        resp = super().partial_update(request, *args, **kwargs)
        # Si marcamos como default, apagamos las demás
        card = self.get_object()
        if request.data.get('is_default'):
            PaymentCard.objects.filter(user=request.user).exclude(pk=card.pk).update(is_default=False)
        return resp


class PagoManualView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        if not is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = PagoManualSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DeudaView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        if not is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        deudas = Mensualidad.objects.select_related('atleta', 'apoderado').filter(estado__in=['pendiente', 'vencido'])
        mensualidades_data = []
        for m in deudas:
            mensualidades_data.append({
                'fuente': 'mensualidad',
                'id': m.id,
                'atleta': m.atleta_id,
                'atleta_nombre': getattr(m.atleta, 'nombre_completo', ''),
                'apoderado': m.apoderado_id,
                'apoderado_nombre': getattr(m.apoderado, 'name', ''),
                'apoderado_email': getattr(m.apoderado, 'email', ''),
                'monto_total': float(m.monto_total),
                'fecha_vencimiento': m.fecha_vencimiento,
                'estado': m.estado,
                'concepto': f"Mensualidad {m.mes}/{m.anio}",
            })
        obligs = PagoOnlineObligacion.objects.select_related('pago', 'apoderado', 'atleta').filter(estado__in=['pendiente', 'vencido'])
        obligs_data = []
        for o in obligs:
            obligs_data.append({
                'fuente': 'pago_online',
                'id': o.id,
                'atleta': o.atleta_id,
                'atleta_nombre': getattr(o.atleta, 'nombre_completo', ''),
                'apoderado': o.apoderado_id,
                'apoderado_nombre': getattr(o.apoderado, 'name', ''),
                'apoderado_email': getattr(o.apoderado, 'email', ''),
                'monto_total': float(o.monto),
                'fecha_vencimiento': getattr(o.pago, 'fecha_vencimiento', None),
                'estado': o.estado,
                'concepto': getattr(o.pago, 'titulo', 'Pago online'),
            })
        return Response(mensualidades_data + obligs_data)

    @action(detail=False, methods=['get'], url_path='mis-deudas')
    def mis_deudas(self, request):
        mensualidades = Mensualidad.objects.select_related('atleta').filter(
            apoderado=request.user, estado__in=['pendiente', 'vencido']
        )
        mensualidades_data = []
        for m in mensualidades:
            mensualidades_data.append({
                'fuente': 'mensualidad',
                'id': m.id,
                'atleta': m.atleta_id,
                'atleta_nombre': getattr(m.atleta, 'nombre_completo', ''),
                'apoderado': m.apoderado_id,
                'apoderado_nombre': getattr(request.user, 'name', ''),
                'apoderado_email': getattr(request.user, 'email', ''),
                'monto_total': float(m.monto_total),
                'fecha_vencimiento': m.fecha_vencimiento,
                'estado': m.estado,
                'concepto': f"Mensualidad {m.mes}/{m.anio}",
            })

        obligs = PagoOnlineObligacion.objects.select_related('pago', 'atleta').filter(
            apoderado=request.user, estado__in=['pendiente', 'vencido']
        )
        obligs_data = []
        for o in obligs:
            obligs_data.append({
                'fuente': 'pago_online',
                'id': o.id,
                'atleta': o.atleta_id,
                'atleta_nombre': getattr(o.atleta, 'nombre_completo', ''),
                'apoderado': request.user.id,
                'apoderado_nombre': getattr(request.user, 'name', ''),
                'apoderado_email': getattr(request.user, 'email', ''),
                'monto_total': float(o.monto),
                'fecha_vencimiento': getattr(o.pago, 'fecha_vencimiento', None),
                'estado': o.estado,
                'concepto': getattr(o.pago, 'titulo', 'Pago online'),
            })

        return Response(mensualidades_data + obligs_data)


class ReportesFinancierosView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        if not is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        def parse_date(value):
            try:
                return datetime.fromisoformat(value).date()
            except Exception:
                return None

        fecha_inicio = parse_date(request.query_params.get('fecha_inicio') or '')
        fecha_fin = parse_date(request.query_params.get('fecha_fin') or '')
        tipo_filter = (request.query_params.get('tipo') or 'todos').lower()
        metodo_filter = (request.query_params.get('metodo_pago') or 'todos').lower()
        estado_filter = (request.query_params.get('estado') or 'pagado').lower()

        movimientos = []
        totales = {
            'matriculas': 0,
            'mensualidades': 0,
            'pagos_online': 0,
            'pagos_online_musica': 0,
            'pagos_online_competencia': 0,
            'pagos_online_otros': 0,
            'pagos_manuales': 0,
            'egresos': 0,
            'ventas': 0,
        }

        def fecha_en_rango(dt):
            if not dt:
                return True
            if isinstance(dt, datetime):
                dt = dt.date()
            if fecha_inicio and dt < fecha_inicio:
                return False
            if fecha_fin and dt > fecha_fin:
                return False
            return True

        def acepta_tipo(tipo):
            return tipo_filter in ('', 'todos') or tipo_filter == tipo

        def acepta_metodo(metodo):
            if metodo_filter in ('', 'todos', None):
                return True
            return (metodo or '').lower() == metodo_filter

        def add_movimiento(base):
            base_tipo = base.get('tipo', '')
            metodo = base.get('metodo_pago', '')
            fecha_val = base.get('fecha')
            if not acepta_tipo(base_tipo):
                return
            if not acepta_metodo(metodo):
                return
            if not fecha_en_rango(fecha_val):
                return
            movimientos.append({
                **base,
                'fecha': fecha_val.isoformat() if isinstance(fecha_val, (datetime, date)) else fecha_val,
            })

        # Matriculas
        mats_qs = Matricula.objects.select_related('atleta', 'periodo', 'apoderado')
        if estado_filter != 'todos':
            mats_qs = mats_qs.filter(estado_pago=estado_filter)
        if fecha_inicio or fecha_fin:
            mats_qs = mats_qs.filter(
                Q(fecha_pago__date__gte=fecha_inicio) | Q(fecha_pago__isnull=True, created_at__date__gte=fecha_inicio)
            ) if fecha_inicio else mats_qs
            mats_qs = mats_qs.filter(
                Q(fecha_pago__date__lte=fecha_fin) | Q(fecha_pago__isnull=True, created_at__date__lte=fecha_fin)
            ) if fecha_fin else mats_qs
        for m in mats_qs:
            fecha_val = m.fecha_pago.date() if m.fecha_pago else m.created_at.date()
            metodo = getattr(m, 'metodo_pago', None) or 'webpay'
            monto = float(m.monto_pagado or m.monto_total or 0)
            add_movimiento({
                'id': m.id,
                'tipo': 'matriculas',
                'metodo_pago': metodo,
                'monto': monto,
                'fecha': fecha_val,
                'descripcion': f"Matricula {getattr(m.atleta, 'nombre_completo', '') or m.atleta_id}",
            })
            if acepta_tipo('matriculas') and acepta_metodo(metodo) and fecha_en_rango(fecha_val):
                totales['matriculas'] += monto

        # Mensualidades
        mens_qs = Mensualidad.objects.select_related('atleta', 'apoderado')
        if estado_filter != 'todos':
            mens_qs = mens_qs.filter(estado=estado_filter)
        if fecha_inicio:
            mens_qs = mens_qs.filter(Q(fecha_pago__date__gte=fecha_inicio) | Q(fecha_pago__isnull=True, created_at__date__gte=fecha_inicio))
        if fecha_fin:
            mens_qs = mens_qs.filter(Q(fecha_pago__date__lte=fecha_fin) | Q(fecha_pago__isnull=True, created_at__date__lte=fecha_fin))
        for m in mens_qs:
            fecha_val = m.fecha_pago.date() if m.fecha_pago else m.created_at.date()
            metodo = getattr(m, 'metodo_pago', None) or 'manual'
            monto = float(m.monto_total or 0)
            add_movimiento({
                'id': m.id,
                'tipo': 'mensualidades',
                'metodo_pago': metodo,
                'monto': monto,
                'fecha': fecha_val,
                'descripcion': f"Mensualidad {m.mes}/{m.anio} - {getattr(m.atleta, 'nombre_completo', '') or m.atleta_id}",
            })
            if acepta_tipo('mensualidades') and acepta_metodo(metodo) and fecha_en_rango(fecha_val):
                totales['mensualidades'] += monto

        # Pagos online (obligaciones)
        obligs_qs = PagoOnlineObligacion.objects.select_related('pago', 'apoderado', 'atleta')
        if estado_filter != 'todos':
            obligs_qs = obligs_qs.filter(estado=estado_filter)
        if fecha_inicio:
            obligs_qs = obligs_qs.filter(Q(fecha_pago__date__gte=fecha_inicio) | Q(fecha_pago__isnull=True, created_at__date__gte=fecha_inicio))
        if fecha_fin:
            obligs_qs = obligs_qs.filter(Q(fecha_pago__date__lte=fecha_fin) | Q(fecha_pago__isnull=True, created_at__date__lte=fecha_fin))
        for o in obligs_qs:
            fecha_val = o.fecha_pago.date() if o.fecha_pago else o.created_at.date()
            metodo = getattr(o, 'metodo_pago', None) or 'webpay'
            monto = float(o.monto or 0)
            descripcion = getattr(o.pago, 'titulo', 'Pago online')
            pago_tipo = getattr(o.pago, 'tipo', '') or ''
            if pago_tipo == 'mensualidad':
                tipo_mov = 'mensualidades'
            elif pago_tipo == 'musica':
                tipo_mov = 'pagos_online_musica'
            elif pago_tipo == 'competencia':
                tipo_mov = 'pagos_online_competencia'
            else:
                tipo_mov = 'pagos_online_otros'
            add_movimiento({
                'id': o.id,
                'tipo': tipo_mov,
                'metodo_pago': metodo,
                'monto': monto,
                'fecha': fecha_val,
                'descripcion': descripcion,
            })
            if acepta_tipo(tipo_mov) and acepta_metodo(metodo) and fecha_en_rango(fecha_val):
                if tipo_mov == 'mensualidades':
                    totales['mensualidades'] += monto
                elif tipo_mov == 'pagos_online_musica':
                    totales['pagos_online_musica'] += monto
                    totales['pagos_online'] += monto
                elif tipo_mov == 'pagos_online_competencia':
                    totales['pagos_online_competencia'] += monto
                    totales['pagos_online'] += monto
                else:
                    totales['pagos_online_otros'] += monto
                    totales['pagos_online'] += monto

        # Pagos manuales
        pago_manual_qs = PagoManual.objects.all()
        if fecha_inicio:
            pago_manual_qs = pago_manual_qs.filter(created_at__date__gte=fecha_inicio)
        if fecha_fin:
            pago_manual_qs = pago_manual_qs.filter(created_at__date__lte=fecha_fin)
        for pm in pago_manual_qs:
            fecha_val = pm.created_at.date()
            metodo = getattr(pm, 'metodo_pago', None) or 'manual'
            monto = float(pm.monto or 0)
            add_movimiento({
                'id': pm.id,
                'tipo': 'pagos_presenciales',
                'metodo_pago': metodo,
                'monto': monto,
                'fecha': fecha_val,
                'descripcion': pm.concepto or 'Pago manual',
            })
            if acepta_tipo('pagos_presenciales') and acepta_metodo(metodo) and fecha_en_rango(fecha_val):
                totales['pagos_manuales'] += monto

        # Egresos
        egresos_qs = Egreso.objects.all()
        if fecha_inicio:
            egresos_qs = egresos_qs.filter(fecha__gte=fecha_inicio)
        if fecha_fin:
            egresos_qs = egresos_qs.filter(fecha__lte=fecha_fin)
        for e in egresos_qs:
            fecha_val = e.fecha
            metodo = getattr(e, 'metodo_pago', None) or 'efectivo'
            monto = float(e.monto or 0)
            add_movimiento({
                'id': e.id,
                'tipo': 'egresos',
                'metodo_pago': metodo,
                'monto': -monto,
                'fecha': fecha_val,
                'descripcion': e.concepto,
                'categoria': e.categoria,
            })
            if acepta_tipo('egresos') and acepta_metodo(metodo) and fecha_en_rango(fecha_val):
                totales['egresos'] += monto

        total_deudas_mensualidades = Mensualidad.objects.filter(estado__in=['pendiente', 'vencido']).aggregate(total=Sum('monto_total'))['total'] or 0
        total_deudas_online = PagoOnlineObligacion.objects.filter(estado__in=['pendiente', 'vencido']).aggregate(total=Sum('monto'))['total'] or 0
        deudas_pendientes = float(total_deudas_mensualidades + total_deudas_online)

        total_ingresos = totales['matriculas'] + totales['mensualidades'] + totales['pagos_online'] + totales['pagos_manuales']
        balance = total_ingresos - totales['egresos']

        data = {
            'matriculas': totales['matriculas'],
            'mensualidades': totales['mensualidades'],
            'pagos_online': totales['pagos_online'],
            'pagos_online_musica': totales['pagos_online_musica'],
            'pagos_online_competencia': totales['pagos_online_competencia'],
            'pagos_online_otros': totales['pagos_online_otros'],
            'pagos_manuales': totales['pagos_manuales'],
            'egresos': totales['egresos'],
            'ventas': totales['ventas'],
            'total_ingresos': total_ingresos,
            'total_egresos': totales['egresos'],
            'balance': balance,
            'deudas_pendientes': deudas_pendientes,
            'movimientos': sorted(movimientos, key=lambda m: m.get('fecha', ''), reverse=True),
            'filtros': {
                'fecha_inicio': fecha_inicio.isoformat() if fecha_inicio else None,
                'fecha_fin': fecha_fin.isoformat() if fecha_fin else None,
                'tipo': tipo_filter,
                'metodo_pago': metodo_filter,
                'estado': estado_filter,
            }
        }
        return Response(data)


class WebpayInitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        matricula_id = request.data.get('matricula_id')
        buy_order = request.data.get('buy_order') or uuid.uuid4().hex[:26]
        session_id = request.data.get('session_id') or str(request.user.id)
        if not matricula_id:
            return Response({'detail': 'matricula_id requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            matricula = Matricula.objects.get(pk=matricula_id, apoderado=request.user)
        except Matricula.DoesNotExist:
            return Response({'detail': 'Matrícula no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        try:
            # Siempre usamos el monto total almacenado en la matrícula
            amount_val = float(matricula.monto_total)
        except Exception:
            return Response({'detail': 'Monto inválido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            options = WebpayOptions(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, "TEST")
            # La URL de retorno debe ir al frontend; desde allí se hace POST a /webpay/confirmar/ con token_ws
            frontend_return = getattr(settings, 'FRONTEND_WEBPAY_RETURN_URL', None) or getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            # Aseguramos que exista un path para capturar token_ws en el front (ej: /webpay-retorno)
            return_url = f"{frontend_return.rstrip('/')}/webpay-retorno"
            tx = Transaction(options)
            response = tx.create(buy_order, session_id, amount_val, return_url)
            token = response.get('token')
            url = response.get('url')
            if not token or not url:
                return Response({'detail': 'No se pudo iniciar transacción (sin token/url)'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            WebpayTransaction.objects.create(matricula=matricula, token=token, estado='iniciada')
            return Response({'url': url, 'token': token})
        except Exception as ex:
            return Response({'detail': f'Error al iniciar Webpay: {ex}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WebpayConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token') or request.data.get('token_ws')
        if not token:
            return Response({'detail': 'token requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            options = WebpayOptions(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, "TEST")
            tx = Transaction(options)
            resp = tx.commit(token)
        except Exception as ex:
            return Response({'detail': f'Error al confirmar con Webpay: {ex}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            tx_model = WebpayTransaction.objects.select_related('matricula').get(token=token)
        except WebpayTransaction.DoesNotExist:
            return Response({'detail': 'Transacción no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        # Aceptamos código 0 como éxito; si no viene explícito, asumimos éxito en sandbox
        response_code = None
        if isinstance(resp, dict):
            response_code = resp.get('response_code')
        elif hasattr(resp, 'response_code'):
            response_code = getattr(resp, 'response_code')
        if response_code in [0, None]:
            tx_model.estado = 'confirmada'
            matricula = tx_model.matricula
            matricula.estado_pago = 'pagado'
            matricula.monto_pagado = matricula.monto_total
            matricula.save(update_fields=['estado_pago', 'monto_pagado'])
            # Si el apoderado sigue en rol "public", lo promovemos a apoderado
            apoderado = matricula.apoderado
            if getattr(apoderado, 'role', None) == 'public':
                apoderado.role = 'apoderado'
                apoderado.save(update_fields=['role'])
            tx_model.save(update_fields=['estado'])
            atleta_serialized = AtletaSerializer(matricula.atleta, context={'request': request}).data
            return Response({
                'status': 'ok',
                'matricula': MatriculaSerializer(matricula).data,
                'atleta': atleta_serialized,
                'user': {
                    'id': apoderado.id,
                    'email': apoderado.email,
                    'name': getattr(apoderado, 'name', ''),
                    'role': getattr(apoderado, 'role', ''),
                    'phone': getattr(apoderado, 'phone', ''),
                }
            })
        tx_model.estado = 'rechazada'
        tx_model.save(update_fields=['estado'])
        return Response({'status': 'error', 'detail': 'Pago rechazado', 'response_code': response_code, 'response': resp}, status=status.HTTP_400_BAD_REQUEST)


class WebpayReturnView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Si alguien llega por GET (lo habitual en Webpay), redirigimos al frontend con el token_ws
        token = request.GET.get('token_ws') or ''
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        redirect_url = f"{frontend_url.rstrip('/')}/webpay-retorno?token_ws={token}" if token else frontend_url
        html = f"""<html><body>Redirigiendo...<script>window.location='{redirect_url}';</script></body></html>"""
        return HttpResponse(html)

    def post(self, request):
        # Por compatibilidad, manejamos POST igual que GET
        token = request.data.get('token_ws') or ''
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        redirect_url = f"{frontend_url.rstrip('/')}/webpay-retorno?token_ws={token}" if token else frontend_url
        html = f"""<html><body>Redirigiendo...<script>window.location='{redirect_url}';</script></body></html>"""
        return HttpResponse(html)


class WebpayPagoOnlineInitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        obligacion_id = request.data.get('obligacion_id')
        buy_order = request.data.get('buy_order') or uuid.uuid4().hex[:26]
        session_id = request.data.get('session_id') or str(request.user.id)
        if not obligacion_id:
            return Response({'detail': 'obligacion_id requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            obligacion = PagoOnlineObligacion.objects.select_related('apoderado').get(pk=obligacion_id, apoderado=request.user)
        except PagoOnlineObligacion.DoesNotExist:
            return Response({'detail': 'Obligacion no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        if obligacion.estado == 'pagado':
            return Response({'detail': 'Obligacion ya pagada'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount_val = float(obligacion.monto)
        except Exception:
            return Response({'detail': 'Monto invalido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            options = WebpayOptions(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, "TEST")
            frontend_return = getattr(settings, 'FRONTEND_WEBPAY_RETURN_URL', None) or getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            return_url = f"{frontend_return.rstrip('/')}/pagos-online-retorno"
            tx = Transaction(options)
            response = tx.create(buy_order, session_id, amount_val, return_url)
            token = response.get('token')
            url = response.get('url')
            if not token or not url:
                return Response({'detail': 'No se pudo iniciar transaccion (sin token/url)'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            WebpayPagoOnlineTransaction.objects.create(obligacion=obligacion, token=token, estado='iniciada')
            return Response({'url': url, 'token': token})
        except Exception as ex:
            return Response({'detail': f'Error al iniciar Webpay: {ex}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WebpayPagoOnlineConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token') or request.data.get('token_ws')
        if not token:
            return Response({'detail': 'token requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            options = WebpayOptions(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, "TEST")
            tx = Transaction(options)
            resp = tx.commit(token)
        except Exception as ex:
            return Response({'detail': f'Error al confirmar con Webpay: {ex}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            tx_model = WebpayPagoOnlineTransaction.objects.select_related('obligacion').get(token=token)
        except WebpayPagoOnlineTransaction.DoesNotExist:
            return Response({'detail': 'Transaccion no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        response_code = None
        if isinstance(resp, dict):
            response_code = resp.get('response_code')
        elif hasattr(resp, 'response_code'):
            response_code = getattr(resp, 'response_code')

        obligacion = tx_model.obligacion
        if response_code in [0, None]:
            tx_model.estado = 'confirmada'
            obligacion.estado = 'pagado'
            obligacion.monto = obligacion.monto  # asegurar persistencia actual
            obligacion.metodo_pago = 'webpay'
            obligacion.fecha_pago = timezone.now()
            obligacion.save(update_fields=['estado', 'metodo_pago', 'fecha_pago'])
            tx_model.save(update_fields=['estado'])
            data = PagoOnlineObligacionSerializer(obligacion, context={'request': request}).data
            return Response({'status': 'ok', 'obligacion': data})

        tx_model.estado = 'rechazada'
        tx_model.save(update_fields=['estado'])
        return Response({'status': 'error', 'detail': 'Pago rechazado', 'response_code': response_code, 'response': resp}, status=status.HTTP_400_BAD_REQUEST)

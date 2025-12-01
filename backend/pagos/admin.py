from django.contrib import admin
from .models import (
    PeriodoMatricula, Matricula, ConfiguracionMensualidad, Mensualidad, PagoManual,
    PagoOnline, PagoOnlineObligacion, WebpayPagoOnlineTransaction, PaymentCard, WebpayTransaction
)

admin.site.register(PeriodoMatricula)
admin.site.register(Matricula)
admin.site.register(ConfiguracionMensualidad)
admin.site.register(Mensualidad)
admin.site.register(PagoManual)
admin.site.register(PagoOnline)
admin.site.register(PagoOnlineObligacion)
admin.site.register(WebpayTransaction)
admin.site.register(WebpayPagoOnlineTransaction)
admin.site.register(PaymentCard)

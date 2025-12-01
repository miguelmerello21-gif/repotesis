from pathlib import Path

path = Path("backend/users/views.py")
text = path.read_text(encoding="utf-8", errors="replace")

old = "        # Enviamos el c�digo por correo usando SMTP real configurado en settings\n        try:\n            send_mail(\n                subject=\"Recuperaci�n de contrase�a\",\n                message=f\"Tu c�digo para recuperar la contrase�a es: {short_code}. Si no solicitaste este cambio, puedes ignorar este mensaje.\",\n                from_email=getattr(settings, \"DEFAULT_FROM_EMAIL\", None) or getattr(settings, \"EMAIL_HOST_USER\", None),\n                recipient_list=[email],\n                fail_silently=True,\n            )\n        except Exception:\n            # Silencioso para no revelar existencia del correo\n            pass\n        # Respuesta gen�rica (no exponemos el c�digo)\n        return Response({\"detail\": \"Si el correo existe, se ha enviado un c�digo de recuperaci�n.\"})\n"

new = "        # Enviamos el código por correo usando SMTP real configurado en settings\n        try:\n            send_mail(\n                subject=\"Recuperación de contraseña\",\n                message=f\"Tu código para recuperar la contraseña es: {short_code}. Si no solicitaste este cambio, puedes ignorar este mensaje.\",\n                from_email=getattr(settings, \"DEFAULT_FROM_EMAIL\", None) or getattr(settings, \"EMAIL_HOST_USER\", None),\n                recipient_list=[email],\n                fail_silently=True,\n            )\n        except Exception:\n            # Silencioso para no revelar existencia del correo\n            pass\n        # Respuesta genérica (no exponemos el código)\n        return Response({\"detail\": \"Si el correo existe, se ha enviado un código de recuperación.\"})\n"

if old not in text:
    raise SystemExit("old block not found")

path.write_text(text.replace(old, new), encoding="utf-8")
print("patched request view")

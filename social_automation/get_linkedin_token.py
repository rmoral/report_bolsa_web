"""
LinkedIn OAuth 2.0 — obtener access token y person URN.

Ejecutar en el SERVIDOR (no necesita navegador en el servidor):

    .venv/bin/python get_linkedin_token.py

Flujo:
  1. El script imprime una URL de autorización
  2. Abre esa URL en TU NAVEGADOR (en tu ordenador, no en el servidor)
  3. Inicia sesión en LinkedIn y autoriza la app
  4. El navegador intenta redirigir a http://localhost:8000/callback
     → verás "Esta página no está disponible" — ES NORMAL
     → copia la URL COMPLETA de la barra del navegador
  5. Pega esa URL aquí en el terminal del servidor
  6. El script obtiene el token y el URN automáticamente

Requisitos previos en .env:
    LINKEDIN_CLIENT_ID=...
    LINKEDIN_CLIENT_SECRET=...

Y en el portal de LinkedIn (linkedin.com/developers/apps → Auth):
    Redirect URL registrada: http://localhost:8000/callback
"""
import os
import re
import sys
import secrets
import urllib.parse

import requests
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "").strip()
CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "").strip()
REDIRECT_URI = "http://localhost:8000/callback"
SCOPES = ["openid", "profile", "w_member_social"]


def main():
    if not CLIENT_ID or not CLIENT_SECRET:
        print(
            "\nERROR: Faltan credenciales.\n"
            "Añade al .env del servidor:\n"
            "  LINKEDIN_CLIENT_ID=tu_client_id\n"
            "  LINKEDIN_CLIENT_SECRET=tu_client_secret\n"
            "\nEncuéntralos en: linkedin.com/developers/apps → tu app → Auth"
        )
        sys.exit(1)

    state = secrets.token_urlsafe(16)

    auth_params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": " ".join(SCOPES),
        "state": state,
    }
    auth_url = (
        "https://www.linkedin.com/oauth/v2/authorization?"
        + urllib.parse.urlencode(auth_params)
    )

    print("\n" + "=" * 68)
    print("PASO 1 — Abre esta URL en tu navegador (en tu ordenador):")
    print("=" * 68)
    print(auth_url)
    print("=" * 68)
    print(
        "\nDespués de autorizar, el navegador mostrará un error de conexión"
        "\n(no hay nada en localhost:8000). Eso es correcto."
        "\nCopia la URL COMPLETA de la barra del navegador. Tendrá este formato:"
        f"\n  http://localhost:8000/callback?code=AQT...&state={state[:8]}..."
        "\n"
    )

    redirect_url = input("PASO 2 — Pega aquí la URL completa del navegador: ").strip()

    # Extract code and state from redirect URL
    parsed = urllib.parse.urlparse(redirect_url)
    params = urllib.parse.parse_qs(parsed.query)

    if "error" in params:
        desc = params.get("error_description", params.get("error", ["error desconocido"]))[0]
        print(f"\nERROR de LinkedIn: {desc}")
        sys.exit(1)

    code = params.get("code", [None])[0]
    returned_state = params.get("state", [None])[0]

    if not code:
        print("\nERROR: No se encontró el parámetro 'code' en la URL.")
        print("Asegúrate de copiar la URL completa de la barra del navegador.")
        sys.exit(1)

    if returned_state != state:
        print(
            f"\nAVISO: El parámetro state no coincide."
            f"\n  Esperado: {state}"
            f"\n  Recibido: {returned_state}"
            "\nSi copiaste la URL correctamente, continúa de todos modos (y/n): ",
            end=""
        )
        if input().strip().lower() != "y":
            sys.exit(1)

    print("\nIntercambiando código por token…")

    token_resp = requests.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )

    if not token_resp.ok:
        print(f"\nERROR al obtener token: {token_resp.status_code} {token_resp.text}")
        sys.exit(1)

    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    expires_days = token_data.get("expires_in", 0) // 86400

    if not access_token:
        print(f"\nERROR: Respuesta inesperada: {token_data}")
        sys.exit(1)

    print("Token obtenido. Obteniendo tu Person URN…")

    # Get person URN via OpenID userinfo endpoint
    userinfo_resp = requests.get(
        "https://api.linkedin.com/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )

    sub = None
    name = ""
    if userinfo_resp.ok:
        udata = userinfo_resp.json()
        sub = udata.get("sub")
        name = udata.get("name", "")
    else:
        # Fallback: v2/me
        me_resp = requests.get(
            "https://api.linkedin.com/v2/me",
            headers={
                "Authorization": f"Bearer {access_token}",
                "X-Restli-Protocol-Version": "2.0.0",
            },
            timeout=15,
        )
        if me_resp.ok:
            mdata = me_resp.json()
            sub = mdata.get("id")
            first = mdata.get("localizedFirstName", "")
            last = mdata.get("localizedLastName", "")
            name = f"{first} {last}".strip()

    person_urn = f"urn:li:person:{sub}" if sub else None

    # Fetch company pages the user administers
    org_urn = None
    orgs = _get_admin_organizations(access_token)

    print("\n" + "=" * 68)
    print("Añade estas líneas al .env del servidor y reinicia el servicio:")
    print("=" * 68)
    print(f"LINKEDIN_ACCESS_TOKEN={access_token}")
    if person_urn:
        print(f"LINKEDIN_PERSON_URN={person_urn}")
    else:
        print("LINKEDIN_PERSON_URN=urn:li:person:REEMPLAZA_CON_TU_ID")

    if orgs:
        print("\n# Páginas de empresa que administras (elige una para publicar como empresa):")
        for org in orgs:
            print(f"LINKEDIN_ORGANIZATION_URN={org['urn']}  # {org['name']}")
    else:
        print("\n# Para publicar como empresa añade también:")
        print("# LINKEDIN_ORGANIZATION_URN=urn:li:organization:TU_ID_EMPRESA")
        print("# (ve a linkedin.com/company/TU-EMPRESA/admin/ y copia el ID numérico de la URL)")

    print("=" * 68)
    if name:
        print(f"Cuenta autenticada: {name}")
    print(f"El token expira en ~{expires_days} días.")
    print("Vuelve a ejecutar este script antes de que expire y actualiza el .env.")

    if not person_urn:
        print(
            "\nNo se pudo obtener el Person URN automáticamente."
            "\nObtenlo con: curl -s -H 'Authorization: Bearer TOKEN'"
            " https://api.linkedin.com/v2/userinfo"
        )


def _get_admin_organizations(access_token: str) -> list:
    """Return list of {urn, name} for company pages the user admins."""
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "X-Restli-Protocol-Version": "2.0.0",
        }
        # Get organization ACLs where user is admin
        acl_resp = requests.get(
            "https://api.linkedin.com/v2/organizationalEntityAcls"
            "?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&projection="
            "(elements*(organizationalTarget,role))",
            headers=headers,
            timeout=15,
        )
        if not acl_resp.ok:
            return []

        elements = acl_resp.json().get("elements", [])
        org_urns = [
            e["organizationalTarget"]
            for e in elements
            if "organizationalTarget" in e
        ]
        if not org_urns:
            return []

        # Fetch names for each organization URN
        results = []
        for urn in org_urns:
            org_id = urn.split(":")[-1]
            org_resp = requests.get(
                f"https://api.linkedin.com/v2/organizations/{org_id}"
                "?projection=(id,localizedName)",
                headers=headers,
                timeout=15,
            )
            if org_resp.ok:
                odata = org_resp.json()
                results.append({
                    "urn": urn,
                    "name": odata.get("localizedName", org_id),
                })
        return results
    except Exception:
        return []


if __name__ == "__main__":
    main()

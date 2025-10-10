import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Precios EarlyMarketReports - Planes Lite y Pro'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1B263B 0%, #2ECC71 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: 'white',
            padding: '40px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              marginBottom: '20px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            💰 Precios
          </div>
          <div
            style={{
              fontSize: '36px',
              marginBottom: '20px',
              opacity: 0.9,
            }}
          >
            EarlyMarketReports
          </div>
          <div
            style={{
              fontSize: '28px',
              marginBottom: '20px',
              opacity: 0.8,
            }}
          >
            Planes Lite y Pro
          </div>
          <div
            style={{
              fontSize: '20px',
              opacity: 0.7,
              maxWidth: '800px',
              lineHeight: '1.4',
            }}
          >
            Desde gratis hasta análisis completo. 
            Prueba Pro 7 días sin compromiso.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'EarlyMarketReports - Informes bursátiles diarios'
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
              fontSize: '72px',
              fontWeight: 'bold',
              marginBottom: '20px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            📊 EarlyMarketReports
          </div>
          <div
            style={{
              fontSize: '32px',
              marginBottom: '20px',
              opacity: 0.9,
            }}
          >
            Informes bursátiles diarios
          </div>
          <div
            style={{
              fontSize: '24px',
              opacity: 0.8,
              maxWidth: '800px',
              lineHeight: '1.4',
            }}
          >
            Análisis del mercado antes de la apertura. 
            Suscríbete gratis o prueba Pro.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

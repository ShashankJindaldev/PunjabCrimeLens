import { useId } from 'react'

export default function PunjabLogo({ className = 'h-9 w-9', title = 'PunjabCrimeLens' }) {
  // useId keeps gradient ids unique when the logo renders more than once (sidebar + mobile bar).
  const uid = useId().replace(/:/g, '')

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${uid}-fill`} x1="16" y1="3" x2="16" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f8ba5a" stopOpacity="0.3" />
          <stop offset="1" stopColor="#cc6a1f" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id={`${uid}-stroke`} x1="5" y1="4" x2="27" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbd592" />
          <stop offset="1" stopColor="#d9772b" />
        </linearGradient>
      </defs>

      {/* State outline */}
      <path
        d="M17.1 3.9 13.5 8.1 9.8 11.5 8.4 16.6 4.7 22.6 8.4 28.5 16.4 29.4 22.3 26 26.6 20.9 26.6 14.9 21.5 10.7 19.3 6.4Z"
        fill={`url(#${uid}-fill)`}
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="1.25"
        strokeLinejoin="round"
      />

      {/* Fine data mesh radiating from the focal node */}
      <path
        d="M19 17.5 17.1 3.9M19 17.5 4.7 22.6M19 17.5 16.4 29.4M19 17.5 26.6 14.9"
        stroke="#f8ba5a"
        strokeOpacity="0.28"
        strokeWidth="0.6"
        strokeLinecap="round"
      />

      {/* Focal node ("lens") */}
      <circle cx="19" cy="17.5" r="2.6" stroke="#f8ba5a" strokeOpacity="0.5" strokeWidth="0.7" />
      <circle cx="19" cy="17.5" r="1.2" fill="#fbd592" />
    </svg>
  )
}

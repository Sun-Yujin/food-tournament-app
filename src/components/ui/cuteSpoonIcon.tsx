export function CuteSpoonIcon({ size = 20, color = "#f4b942" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 숟가락 머리 (좀 더 크고 동그랗게 변경) */}
      <path
        d="M24 10C24 4.47715 28.4772 0 34 0C39.5228 0 44 4.47715 44 10C44 15.5228 39.5228 20 34 20C28.4772 20 24 15.5228 24 10Z"
        fill={color}
      />
      {/* 손잡이 */}
      <path
        d="M33 20H35C36.1046 20 37 20.8954 37 22V60C37 61.1046 36.1046 62 35 62H33C31.8954 62 31 61.1046 31 60V22C31 20.8954 31.8954 20 33 20Z"
        fill={color}
      />
      {/* 외곽선 */}
      <path
        d="M33 20H35C36.1046 20 37 20.8954 37 22V60C37 61.1046 36.1046 62 35 62H33C31.8954 62 31 61.1046 31 60V22C31 20.8954 31.8954 20 33 20Z"
        stroke="#d89b28"
        strokeWidth="2"
      />
      <circle cx="34" cy="10" r="9" stroke="#d89b28" strokeWidth="2" />
    </svg>
  );
}

export default CuteSpoonIcon;
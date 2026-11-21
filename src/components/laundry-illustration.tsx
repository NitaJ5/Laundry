export function LaundryIllustration() {
  return (
    <svg className="laundry-illustration" viewBox="0 0 500 230" role="img" aria-label="Illustration of a washer and dryer">
      <path className="illustration-ground" d="M42 210H459" />
      <g className="illustration-machine">
        <rect x="79" y="37" width="152" height="171" rx="8" />
        <path d="M79 76H231" />
        <rect x="94" y="50" width="42" height="13" rx="3" />
        <circle cx="207" cy="57" r="7" />
        <circle cx="155" cy="136" r="47" />
        <circle className="illustration-window" cx="155" cy="136" r="36" />
        <path className="illustration-water" d="M120 142Q135 133 151 142T190 142M125 155Q140 146 156 155T184 155" />
        <path d="M99 209V215M211 209V215" />
      </g>
      <g className="illustration-machine illustration-dryer">
        <rect x="253" y="37" width="152" height="171" rx="8" />
        <path d="M253 76H405" />
        <path d="M270 55H299M270 61H290" />
        <circle cx="381" cy="57" r="7" />
        <circle cx="329" cy="136" r="47" />
        <circle className="illustration-window" cx="329" cy="136" r="36" />
        <path className="illustration-heat" d="M314 152C301 138 325 133 313 120M330 152C317 138 341 133 329 120M346 152C333 138 357 133 345 120" />
        <path d="M273 209V215M385 209V215" />
      </g>
      <path className="illustration-spark" d="M433 79V95M425 87H441M54 113V125M48 119H60" />
    </svg>
  );
}
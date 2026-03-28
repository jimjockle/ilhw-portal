const TIERS = {
  free: { bg: "bg-gray-100", text: "text-gray-600", label: "FREE" },
  business: { bg: "bg-brand-light-blue", text: "text-brand-blue", label: "BUSINESS" },
  pro: { bg: "bg-brand-light-gold", text: "text-yellow-700", label: "BUSINESS PRO" },
  enterprise: { bg: "bg-purple-100", text: "text-purple-700", label: "ENTERPRISE" },
};

export default function TierBadge({ tier = "free" }) {
  const config = TIERS[tier] || TIERS.free;
  return (
    <span className={`${config.bg} ${config.text} px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide`}>
      {config.label}
    </span>
  );
}

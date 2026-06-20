// app/components/landing/FeatureCard.tsx
type FeatureCardProps = {
    title: string;
    desc: string;
    icon: string;
    bg: string;
  };
  
  export default function FeatureCard({ title, desc, icon, bg }: FeatureCardProps) {
    return (
      <div className={`${bg} rounded-3xl border border-white shadow-md p-6`}>
        <div className="inline-flex items-center justify-center h-9 w-9 rounded-2xl bg-white/80 mb-3 text-lg">
          {icon}
        </div>
        <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-1.5">
          {title}
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed">{desc}</p>
      </div>
    );
  }
  
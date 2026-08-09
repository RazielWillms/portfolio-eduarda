import { ExternalLink } from "lucide-react"
import { Activity } from "@/lib/activities"

export function ActivitiesGrid({ activities }: { activities: Activity[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {activities.map((activity) => (
        <div
          key={activity.title}
          className={`${activity.color} rounded-3xl p-6 border border-white/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4`}
        >
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 bg-white/70 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
              {activity.emoji}
            </div>

            <span className={`text-xs font-bold px-3 py-1 rounded-full ${activity.badgeColor}`}>
              {activity.tag}
            </span>
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">{activity.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>

            {activity.author && (
              <p className="text-xs text-muted-foreground">
                Criado por{" "}
                <a
                  href={activity.author.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  {activity.author.name}
                </a>
              </p>
            )}
          </div>

          <a
            href={activity.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-white/80 hover:bg-white font-bold text-sm px-5 py-2.5 rounded-2xl border border-white/60 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir atividade
          </a>
        </div>
      ))}
    </div>
  )
}
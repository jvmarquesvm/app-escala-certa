import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CalendarPlus, Clock, MessageCircleWarning } from "lucide-react";
import type { ServiceWithAssignments } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getFunctionColorClasses } from "@/lib/function-colors";
import { STATUS_BADGE_CLASS, getDayMonth, formatWeekdayPt, isUpcoming } from "@/lib/status";

function ServiceCard({ service }: { service: ServiceWithAssignments }) {
  const confirmed = service.assignments.filter((a) => a.status === "confirmed").length;
  const total = service.assignments.length;
  const { day, month } = getDayMonth(service.date);

  return (
    <Card className="p-5" data-testid={`card-service-${service.id}`}>
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center justify-center rounded-md bg-primary/10 text-primary w-14 h-14 shrink-0">
          <span className="text-lg font-display font-bold leading-none" data-testid={`text-day-${service.id}`}>
            {day}
          </span>
          <span className="text-xs uppercase leading-none mt-0.5">{month}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-lg font-display font-bold truncate" data-testid={`text-title-${service.id}`}>
              {service.title}
            </h3>
            <Badge
              variant="secondary"
              className={total > 0 && confirmed === total ? STATUS_BADGE_CLASS.confirmed : STATUS_BADGE_CLASS.pending}
              data-testid={`badge-confirmation-${service.id}`}
            >
              {confirmed}/{total} confirmados
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span>{formatWeekdayPt(service.date)}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {service.time}
            </span>
          </div>

          {service.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">Nenhuma função escalada ainda.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-3">
              {service.assignments.map((a) => {
                const colors = getFunctionColorClasses(a.functionColor);
                return (
                  <span
                    key={a.id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${colors.badge}`}
                    data-testid={`chip-assignment-${a.id}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                    {a.functionName}: {a.musicianName}
                    {a.status === "declined" && (
                      <MessageCircleWarning className="h-3 w-3 text-destructive" />
                    )}
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-4">
            <Link href={`/escalas/${service.id}`}>
              <Button variant="outline" size="sm" data-testid={`link-detail-${service.id}`}>
                Ver detalhes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ServiceCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="w-14 h-14 rounded-md shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { data: services, isLoading } = useQuery<ServiceWithAssignments[]>({
    queryKey: ["/api/services"],
  });

  const upcoming = (services ?? [])
    .filter((s) => isUpcoming(s.date))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-xl font-display font-bold" data-testid="text-page-title">
            Próximos cultos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualização centralizada de tudo o que está por vir.
          </p>
        </div>
        <Link href="/nova-escala">
          <Button data-testid="button-new-schedule">
            <CalendarPlus className="h-4 w-4" />
            Nova escala
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <ServiceCardSkeleton />
          <ServiceCardSkeleton />
          <ServiceCardSkeleton />
        </div>
      ) : upcoming.length === 0 ? (
        <div className="empty-state flex flex-col items-center text-center py-16 px-8 text-muted-foreground">
          <div className="w-12 h-12 mb-4 text-muted-foreground/60">
            <CalendarPlus className="w-full h-full" />
          </div>
          <h3 className="text-foreground font-display font-bold text-lg mb-2">Nenhum culto agendado</h3>
          <p className="max-w-[36ch] mb-6">
            Crie a primeira escala e organize quem toca em cada função.
          </p>
          <Link href="/nova-escala">
            <Button data-testid="button-empty-new-schedule">
              <CalendarPlus className="h-4 w-4" />
              Criar escala
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4" data-testid="list-upcoming-services">
          {upcoming.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}

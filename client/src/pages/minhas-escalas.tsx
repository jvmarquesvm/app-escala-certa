import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Check, UserRound, X } from "lucide-react";
import type { AssignmentStatus, MusicianRow, ServiceWithAssignments } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getFunctionColorClasses } from "@/lib/function-colors";
import { STATUS_BADGE_CLASS, STATUS_LABEL, formatWeekdayPt, getDayMonth, isUpcoming } from "@/lib/status";

export default function MinhasEscalas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [musicianId, setMusicianId] = useState<string>("");

  const { data: musicians = [], isLoading: loadingMusicians } = useQuery<MusicianRow[]>({
    queryKey: ["/api/musicians"],
  });
  const { data: services = [], isLoading: loadingServices } = useQuery<ServiceWithAssignments[]>({
    queryKey: ["/api/services"],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "confirmed" | "declined" }) =>
      apiRequest("PATCH", `/api/assignments/${id}`, { status }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: vars.status === "confirmed" ? "Presença confirmada" : "Ausência registrada",
      });
    },
  });

  const myAssignments = useMemo(() => {
    if (!musicianId) return [];
    const id = Number(musicianId);
    return services
      .filter((s) => isUpcoming(s.date))
      .flatMap((s) => s.assignments.filter((a) => a.musicianId === id).map((a) => ({ service: s, assignment: a })))
      .sort((a, b) => (a.service.date + a.service.time).localeCompare(b.service.date + b.service.time));
  }, [services, musicianId]);

  const selectedMusician = musicians.find((m) => m.id === Number(musicianId));

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8">
      <h1 className="text-xl font-display font-bold mb-1" data-testid="text-page-title">
        Minhas escalas
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Confirme sua presença nas próximas escalações.</p>

      <Card className="p-5 mb-6">
        <label className="text-sm font-medium mb-2 block" htmlFor="musician-select">
          Quem é você?
        </label>
        {loadingMusicians ? (
          <Skeleton className="h-9 w-56" />
        ) : (
          <Select value={musicianId} onValueChange={setMusicianId}>
            <SelectTrigger id="musician-select" className="w-full sm:w-64" data-testid="select-current-musician">
              <SelectValue placeholder="Selecione seu nome" />
            </SelectTrigger>
            <SelectContent>
              {musicians.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Card>

      {!musicianId ? (
        <div className="empty-state flex flex-col items-center text-center py-16 px-8 text-muted-foreground">
          <UserRound className="w-10 h-10 mb-4 text-muted-foreground/60" />
          <h3 className="text-foreground font-display font-bold text-lg mb-2">Selecione seu nome</h3>
          <p className="max-w-[36ch]">Escolha seu nome acima para ver suas próximas escalações.</p>
        </div>
      ) : loadingServices ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : myAssignments.length === 0 ? (
        <div className="empty-state flex flex-col items-center text-center py-16 px-8 text-muted-foreground">
          <CalendarCheck className="w-10 h-10 mb-4 text-muted-foreground/60" />
          <h3 className="text-foreground font-display font-bold text-lg mb-2">
            Nenhuma escalação para {selectedMusician?.name}
          </h3>
          <p className="max-w-[36ch]">Você não está escalado em nenhum culto futuro no momento.</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="list-my-assignments">
          {myAssignments.map(({ service, assignment }) => {
            const colors = getFunctionColorClasses(assignment.functionColor);
            const { day, month } = getDayMonth(service.date);
            return (
              <Card key={assignment.id} className="p-5" data-testid={`card-my-assignment-${assignment.id}`}>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center rounded-md bg-primary/10 text-primary w-12 h-12 shrink-0">
                    <span className="text-sm font-display font-bold leading-none">{day}</span>
                    <span className="text-[10px] uppercase leading-none mt-0.5">{month}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold truncate">{service.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatWeekdayPt(service.date)} · {service.time}
                    </p>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${colors.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                      {assignment.functionName}
                    </span>
                  </div>
                  <Badge className={STATUS_BADGE_CLASS[assignment.status as AssignmentStatus]} variant="secondary" data-testid={`badge-my-status-${assignment.id}`}>
                    {STATUS_LABEL[assignment.status as AssignmentStatus]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    className="flex-1"
                    variant={assignment.status === "confirmed" ? "default" : "outline"}
                    onClick={() => statusMutation.mutate({ id: assignment.id, status: "confirmed" })}
                    data-testid={`button-confirm-presence-${assignment.id}`}
                  >
                    <Check className="h-4 w-4" />
                    Confirmar presença
                  </Button>
                  <Button
                    className="flex-1"
                    variant={assignment.status === "declined" ? "destructive" : "outline"}
                    onClick={() => statusMutation.mutate({ id: assignment.id, status: "declined" })}
                    data-testid={`button-decline-presence-${assignment.id}`}
                  >
                    <X className="h-4 w-4" />
                    Não poderei ir
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

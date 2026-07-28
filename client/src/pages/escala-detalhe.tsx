import { useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Plus, Trash2, X } from "lucide-react";
import type { FunctionRow, MusicianRow, ServiceWithAssignments } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as globalQueryClient } from "@/lib/queryClient";
import { getFunctionColorClasses } from "@/lib/function-colors";
import type { AssignmentStatus } from "@shared/schema";
import { STATUS_BADGE_CLASS, STATUS_LABEL, formatWeekdayPt, getDayMonth } from "@/lib/status";

export default function EscalaDetalhe() {
  const params = useParams<{ id: string }>();
  const serviceId = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pickerFunctionId, setPickerFunctionId] = useState<number | null>(null);
  const [pickerMusicianId, setPickerMusicianId] = useState("");

  const { data: service, isLoading } = useQuery<ServiceWithAssignments>({
    queryKey: ["/api/services", serviceId],
  });
  const { data: functions = [] } = useQuery<FunctionRow[]>({ queryKey: ["/api/functions"] });
  const { data: musicians = [] } = useQuery<(MusicianRow & { functionIds: number[] })[]>({
    queryKey: ["/api/musicians"],
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    queryClient.invalidateQueries({ queryKey: ["/api/services", serviceId] });
  };

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "confirmed" | "declined" | "pending" }) =>
      apiRequest("PATCH", `/api/assignments/${id}`, { status }),
    onSuccess: invalidate,
  });

  const addAssignmentMutation = useMutation({
    mutationFn: async ({ functionId, musicianId }: { functionId: number; musicianId: number }) =>
      apiRequest("POST", `/api/services/${serviceId}/assignments`, { functionId, musicianId, serviceId }),
    onSuccess: () => {
      invalidate();
      setPickerFunctionId(null);
      setPickerMusicianId("");
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/assignments/${id}`),
    onSuccess: invalidate,
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/services/${serviceId}`),
    onSuccess: () => {
      globalQueryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Escala excluída" });
      setLocation("/escalas");
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-2xl mx-auto p-6 md:p-8 text-center text-muted-foreground">
        <p>Escala não encontrada.</p>
        <Link href="/escalas">
          <Button variant="outline" className="mt-4" data-testid="button-back-to-list">
            Voltar para escalas
          </Button>
        </Link>
      </div>
    );
  }

  const { day, month } = getDayMonth(service.date);
  const assignedFunctionIds = Array.from(new Set(service.assignments.map((a) => a.functionId)));
  const remainingFunctions = functions.filter((f) => !assignedFunctionIds.includes(f.id));

  const grouped = functions
    .filter((f) => assignedFunctionIds.includes(f.id))
    .map((f) => ({ fn: f, list: service.assignments.filter((a) => a.functionId === f.id) }));

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8">
      <Link href="/escalas">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center justify-center rounded-md bg-primary/10 text-primary w-14 h-14 shrink-0">
            <span className="text-lg font-display font-bold leading-none">{day}</span>
            <span className="text-xs uppercase leading-none mt-0.5">{month}</span>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold" data-testid="text-service-title">
              {service.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatWeekdayPt(service.date)} · {service.time}
            </p>
            {service.notes && <p className="text-sm text-muted-foreground mt-1">{service.notes}</p>}
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" data-testid="button-delete-service">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir esta escala?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação removerá o culto "{service.title}" e todas as escalações associadas. Não é possível desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteServiceMutation.mutate()}
                data-testid="button-confirm-delete"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-5">
        {grouped.map(({ fn, list }) => {
          const colors = getFunctionColorClasses(fn.color);
          return (
            <Card key={fn.id} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                <h3 className="text-sm font-medium">{fn.name}</h3>
              </div>
              <div className="space-y-2">
                {list.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-2.5"
                    data-testid={`row-assignment-${a.id}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.musicianName}</p>
                      {a.musicianPhone && <p className="text-xs text-muted-foreground">{a.musicianPhone}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={STATUS_BADGE_CLASS[a.status as AssignmentStatus]} variant="secondary" data-testid={`badge-status-${a.id}`}>
                        {STATUS_LABEL[a.status as AssignmentStatus]}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Confirmar"
                        onClick={() => statusMutation.mutate({ id: a.id, status: "confirmed" })}
                        data-testid={`button-confirm-${a.id}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Remover"
                        onClick={() => removeAssignmentMutation.mutate(a.id)}
                        data-testid={`button-remove-${a.id}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {pickerFunctionId === fn.id ? (
                <div className="flex items-center gap-2 mt-3">
                  <Select value={pickerMusicianId} onValueChange={setPickerMusicianId}>
                    <SelectTrigger className="w-56" data-testid={`select-add-musician-${fn.id}`}>
                      <SelectValue placeholder="Escolher músico" />
                    </SelectTrigger>
                    <SelectContent>
                      {musicians
                        .filter((m) => !list.some((a) => a.musicianId === m.id))
                        .map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    disabled={!pickerMusicianId}
                    onClick={() =>
                      addAssignmentMutation.mutate({ functionId: fn.id, musicianId: Number(pickerMusicianId) })
                    }
                    data-testid={`button-confirm-add-musician-${fn.id}`}
                  >
                    Adicionar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPickerFunctionId(null)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setPickerFunctionId(fn.id)}
                  data-testid={`button-add-to-${fn.id}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar músico
                </Button>
              )}
            </Card>
          );
        })}

        {remainingFunctions.length > 0 && (
          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-3">Adicionar outra função a esta escala</p>
            <div className="flex flex-wrap gap-2">
              {remainingFunctions.map((f) => (
                <Button
                  key={f.id}
                  size="sm"
                  variant="outline"
                  onClick={() => setPickerFunctionId(f.id)}
                  data-testid={`button-add-function-${f.id}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {f.name}
                </Button>
              ))}
            </div>
            {pickerFunctionId && remainingFunctions.some((f) => f.id === pickerFunctionId) && (
              <div className="flex items-center gap-2 mt-3">
                <Select value={pickerMusicianId} onValueChange={setPickerMusicianId}>
                  <SelectTrigger className="w-56" data-testid={`select-new-function-musician-${pickerFunctionId}`}>
                    <SelectValue placeholder="Escolher músico" />
                  </SelectTrigger>
                  <SelectContent>
                    {musicians.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!pickerMusicianId}
                  onClick={() =>
                    addAssignmentMutation.mutate({
                      functionId: pickerFunctionId,
                      musicianId: Number(pickerMusicianId),
                    })
                  }
                  data-testid="button-confirm-add-new-function"
                >
                  Adicionar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPickerFunctionId(null)}>
                  Cancelar
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

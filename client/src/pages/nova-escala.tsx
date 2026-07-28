import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Plus, Sparkles, X } from "lucide-react";
import type { FunctionRow, MusicianRow, ServiceWithAssignments } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getFunctionColorClasses } from "@/lib/function-colors";
import { formatWeekdayPt, getDayMonth } from "@/lib/status";

const STEPS = ["Culto", "Funções", "Equipe", "Revisão"] as const;

const TITLE_SUGGESTIONS = [
  "Culto de Domingo — Manhã",
  "Culto de Domingo — Noite",
  "Culto de Oração",
  "Ensaio Geral",
  "Culto de Celebração",
];

type Assignment = { functionId: number; musicianId: number };

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function NovaEscala() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState("19:00");
  const [notes, setNotes] = useState("");
  const [functionIds, setFunctionIds] = useState<number[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pickerFunctionId, setPickerFunctionId] = useState<number | null>(null);
  const [pickerMusicianId, setPickerMusicianId] = useState<string>("");

  const { data: functions = [] } = useQuery<FunctionRow[]>({ queryKey: ["/api/functions"] });
  const { data: musicians = [] } = useQuery<(MusicianRow & { functionIds: number[] })[]>({
    queryKey: ["/api/musicians"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/services", {
        service: { title, date, time, notes },
        assignments,
      });
      return (await res.json()) as ServiceWithAssignments;
    },
    onSuccess: (service) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Escala criada", description: `${service.title} está pronta e disponível para a equipe.` });
      setLocation(`/escalas/${service.id}`);
    },
    onError: () => {
      toast({ title: "Não foi possível criar a escala", variant: "destructive" });
    },
  });

  const canAdvance = useMemo(() => {
    if (step === 0) return title.trim().length > 0 && date && time;
    if (step === 1) return functionIds.length > 0;
    if (step === 2) return assignments.length > 0;
    return true;
  }, [step, title, date, time, functionIds, assignments]);

  function toggleFunction(id: number) {
    setFunctionIds((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      // drop assignments for functions that got unchecked
      setAssignments((a) => a.filter((x) => next.includes(x.functionId)));
      return next;
    });
  }

  function useDefaultFunctions() {
    setFunctionIds(functions.map((f) => f.id));
  }

  function addAssignment(functionId: number, musicianId: number) {
    setAssignments((prev) =>
      prev.some((a) => a.functionId === functionId && a.musicianId === musicianId)
        ? prev
        : [...prev, { functionId, musicianId }]
    );
    setPickerFunctionId(null);
    setPickerMusicianId("");
  }

  function removeAssignment(functionId: number, musicianId: number) {
    setAssignments((prev) => prev.filter((a) => !(a.functionId === functionId && a.musicianId === musicianId)));
  }

  const { day, month } = getDayMonth(date || todayIso());

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8">
      <h1 className="text-xl font-display font-bold mb-1" data-testid="text-page-title">
        Nova escala
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Defina data, horário, funções e participantes em poucos passos.
      </p>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8" role="list" aria-label="Etapas">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium shrink-0 ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary/15 text-primary border border-primary"
                    : "bg-muted text-muted-foreground"
              }`}
              data-testid={`step-indicator-${i}`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:inline ${i === step ? "font-medium" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 0: Dados do culto */}
      {step === 0 && (
        <Card className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Título do culto</Label>
            <Input
              id="title"
              list="title-suggestions"
              placeholder="Ex.: Culto de Domingo — Manhã"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-title"
            />
            <datalist id="title-suggestions">
              {TITLE_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} data-testid="input-time" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex.: Chegar 30 minutos antes para a passagem de som."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="input-notes"
            />
          </div>
        </Card>
      )}

      {/* Step 1: Funções */}
      {step === 1 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">Quais funções serão necessárias neste culto?</p>
            <Button variant="outline" size="sm" onClick={useDefaultFunctions} data-testid="button-select-all-functions">
              <Sparkles className="h-3.5 w-3.5" />
              Selecionar todas
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {functions.map((f) => {
              const colors = getFunctionColorClasses(f.color);
              const checked = functionIds.includes(f.id);
              return (
                <label
                  key={f.id}
                  className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer hover-elevate ${
                    checked ? "border-primary" : "border-border"
                  }`}
                  data-testid={`option-function-${f.id}`}
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggleFunction(f.id)} />
                  <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                  <span className="text-sm">{f.name}</span>
                </label>
              );
            })}
          </div>
        </Card>
      )}

      {/* Step 2: Equipe por função */}
      {step === 2 && (
        <Card className="p-6 space-y-6">
          {functionIds.map((fid) => {
            const fn = functions.find((f) => f.id === fid);
            if (!fn) return null;
            const colors = getFunctionColorClasses(fn.color);
            const assigned = assignments.filter((a) => a.functionId === fid);
            const availableMusicians = musicians.filter(
              (m) => !assigned.some((a) => a.musicianId === m.id)
            );
            return (
              <div key={fid}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                  <h3 className="text-sm font-medium">{fn.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {assigned.map((a) => {
                    const mu = musicians.find((m) => m.id === a.musicianId);
                    return (
                      <Badge key={a.musicianId} variant="secondary" className="gap-1.5" data-testid={`badge-assigned-${fid}-${a.musicianId}`}>
                        {mu?.name ?? "—"}
                        <button
                          type="button"
                          aria-label={`Remover ${mu?.name}`}
                          onClick={() => removeAssignment(fid, a.musicianId)}
                          data-testid={`button-remove-assignment-${fid}-${a.musicianId}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                  {assigned.length === 0 && (
                    <span className="text-xs text-muted-foreground">Nenhum músico escalado ainda.</span>
                  )}
                </div>

                {pickerFunctionId === fid ? (
                  <div className="flex items-center gap-2">
                    <Select value={pickerMusicianId} onValueChange={setPickerMusicianId}>
                      <SelectTrigger className="w-56" data-testid={`select-musician-${fid}`}>
                        <SelectValue placeholder="Escolher músico" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMusicians.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!pickerMusicianId}
                      onClick={() => addAssignment(fid, Number(pickerMusicianId))}
                      data-testid={`button-confirm-add-${fid}`}
                    >
                      Adicionar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPickerFunctionId(null)} data-testid={`button-cancel-add-${fid}`}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPickerFunctionId(fid)}
                    disabled={availableMusicians.length === 0}
                    data-testid={`button-add-musician-${fid}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar músico
                  </Button>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {/* Step 3: Revisão */}
      {step === 3 && (
        <Card className="p-6 space-y-5">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Culto</p>
            <p className="font-display font-bold text-lg" data-testid="text-review-title">
              {title}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatWeekdayPt(date)}, {day} de {month} às {time}
            </p>
            {notes && <p className="text-sm text-muted-foreground mt-1">{notes}</p>}
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Equipe escalada</p>
            <div className="space-y-2">
              {functionIds.map((fid) => {
                const fn = functions.find((f) => f.id === fid);
                if (!fn) return null;
                const colors = getFunctionColorClasses(fn.color);
                const assigned = assignments.filter((a) => a.functionId === fid);
                return (
                  <div key={fid} className="flex items-start gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />
                    <span className="font-medium min-w-32">{fn.name}</span>
                    <span className="text-muted-foreground">
                      {assigned.length > 0
                        ? assigned.map((a) => musicians.find((m) => m.id === a.musicianId)?.name).join(", ")
                        : "sem músico"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          data-testid="button-wizard-back"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance} data-testid="button-wizard-next">
            Continuar
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} data-testid="button-create-schedule">
            {createMutation.isPending ? "Criando..." : "Criar escala"}
          </Button>
        )}
      </div>
    </div>
  );
}

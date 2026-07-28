import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Music2, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import type { FunctionRow, MusicianRow } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { apiRequest } from "@/lib/queryClient";
import { getFunctionColorClasses } from "@/lib/function-colors";

type MusicianWithFns = MusicianRow & { functionIds: number[] };

type FormState = { name: string; phone: string; functionIds: number[] };
const EMPTY_FORM: FormState = { name: "", phone: "", functionIds: [] };

export default function Musicos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MusicianWithFns | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: musicians, isLoading } = useQuery<MusicianWithFns[]>({ queryKey: ["/api/musicians"] });
  const { data: functions = [] } = useQuery<FunctionRow[]>({ queryKey: ["/api/functions"] });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/musicians"] });

  const createMutation = useMutation({
    mutationFn: async (data: FormState) => apiRequest("POST", "/api/musicians", data),
    onSuccess: () => {
      invalidate();
      toast({ title: "Músico cadastrado" });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormState }) =>
      apiRequest("PATCH", `/api/musicians/${id}`, data),
    onSuccess: () => {
      invalidate();
      toast({ title: "Músico atualizado" });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/musicians/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Músico removido" });
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(m: MusicianWithFns) {
    setEditing(m);
    setForm({ name: m.name, phone: m.phone, functionIds: m.functionIds });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function toggleFn(id: number) {
    setForm((f) => ({
      ...f,
      functionIds: f.functionIds.includes(id) ? f.functionIds.filter((x) => x !== id) : [...f.functionIds, id],
    }));
  }

  function submit() {
    if (!form.name.trim()) return;
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  }

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-xl font-display font-bold" data-testid="text-page-title">
            Músicos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastre a equipe e as funções que cada um pode exercer.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => (o ? openCreate() : closeDialog())}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-musician">
              <Plus className="h-4 w-4" />
              Novo músico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar músico" : "Novo músico"}</DialogTitle>
              <DialogDescription>Informe os dados e as funções que essa pessoa pode exercer.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="musician-name">Nome</Label>
                <Input
                  id="musician-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  data-testid="input-musician-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="musician-phone">Telefone</Label>
                <Input
                  id="musician-phone"
                  placeholder="(11) 91234-5678"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  data-testid="input-musician-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>Funções</Label>
                <div className="grid grid-cols-2 gap-2">
                  {functions.map((fn) => (
                    <label
                      key={fn.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                      data-testid={`checkbox-function-${fn.id}`}
                    >
                      <Checkbox checked={form.functionIds.includes(fn.id)} onCheckedChange={() => toggleFn(fn.id)} />
                      {fn.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={closeDialog} data-testid="button-cancel-musician">
                Cancelar
              </Button>
              <Button onClick={submit} disabled={!form.name.trim() || pending} data-testid="button-save-musician">
                {pending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : musicians && musicians.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2" data-testid="list-musicians">
          {musicians.map((m) => (
            <Card key={m.id} className="p-4" data-testid={`card-musician-${m.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate" data-testid={`text-musician-name-${m.id}`}>
                      {m.name}
                    </p>
                    {m.phone && <p className="text-xs text-muted-foreground">{m.phone}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => openEdit(m)}
                    data-testid={`button-edit-musician-${m.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7" data-testid={`button-delete-musician-${m.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover {m.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não remove escalações já feitas em cultos passados, mas o músico não poderá mais ser
                          escalado.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(m.id)}
                          data-testid={`button-confirm-delete-musician-${m.id}`}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {m.functionIds.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Nenhuma função definida</span>
                ) : (
                  m.functionIds.map((fid) => {
                    const fn = functions.find((f) => f.id === fid);
                    if (!fn) return null;
                    const colors = getFunctionColorClasses(fn.color);
                    return (
                      <Badge key={fid} variant="secondary" className={colors.badge}>
                        {fn.name}
                      </Badge>
                    );
                  })
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="empty-state flex flex-col items-center text-center py-16 px-8 text-muted-foreground">
          <Music2 className="w-10 h-10 mb-4 text-muted-foreground/60" />
          <h3 className="text-foreground font-display font-bold text-lg mb-2">Nenhum músico cadastrado</h3>
          <p className="max-w-[36ch] mb-6">Cadastre a equipe para começar a montar escalas.</p>
          <Button onClick={openCreate} data-testid="button-empty-new-musician">
            <Plus className="h-4 w-4" />
            Cadastrar músico
          </Button>
        </div>
      )}
    </div>
  );
}

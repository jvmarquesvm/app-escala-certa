import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, ListChecks, Search } from "lucide-react";
import type { ServiceWithAssignments } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDayMonth, formatWeekdayPt, isUpcoming } from "@/lib/status";

export default function Escalas() {
  const { data: services, isLoading } = useQuery<ServiceWithAssignments[]>({
    queryKey: ["/api/services"],
  });
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = services ?? [];
    if (filter === "upcoming") list = list.filter((s) => isUpcoming(s.date));
    if (filter === "past") list = list.filter((s) => !isUpcoming(s.date));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) =>
      filter === "past" ? (b.date + b.time).localeCompare(a.date + a.time) : (a.date + a.time).localeCompare(b.date + b.time)
    );
  }, [services, filter, search]);

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-xl font-display font-bold" data-testid="text-page-title">
            Todas as escalas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Histórico completo de cultos e escalações.</p>
        </div>
        <Link href="/nova-escala">
          <Button data-testid="button-new-schedule">
            <CalendarPlus className="h-4 w-4" />
            Nova escala
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList data-testid="tabs-filter">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Próximos
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Anteriores
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              Todos
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por título"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state flex flex-col items-center text-center py-16 px-8 text-muted-foreground">
          <ListChecks className="w-10 h-10 mb-4 text-muted-foreground/60" />
          <h3 className="text-foreground font-display font-bold text-lg mb-2">Nenhuma escala encontrada</h3>
          <p className="max-w-[36ch]">Ajuste os filtros ou crie uma nova escala.</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="list-all-services">
          {filtered.map((s) => {
            const confirmed = s.assignments.filter((a) => a.status === "confirmed").length;
            const total = s.assignments.length;
            const { day, month } = getDayMonth(s.date);
            return (
              <Link key={s.id} href={`/escalas/${s.id}`}>
                <Card
                  className="p-4 flex items-center gap-4 cursor-pointer hover-elevate"
                  data-testid={`row-service-${s.id}`}
                >
                  <div className="flex flex-col items-center justify-center rounded-md bg-primary/10 text-primary w-12 h-12 shrink-0">
                    <span className="text-sm font-display font-bold leading-none">{day}</span>
                    <span className="text-[10px] uppercase leading-none mt-0.5">{month}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" data-testid={`text-row-title-${s.id}`}>
                      {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatWeekdayPt(s.date)} · {s.time}
                    </p>
                  </div>
                  <Badge variant="secondary" data-testid={`badge-row-confirmation-${s.id}`}>
                    {confirmed}/{total}
                  </Badge>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

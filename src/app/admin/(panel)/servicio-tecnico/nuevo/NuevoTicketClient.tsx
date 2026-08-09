"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/lib/actions/admin-service";
import type { AppRole } from "@/types/database";

export default function NuevoTicketClient({ profiles }: { profiles: Array<{ id: string; full_name: string | null; phone: string | null; role: AppRole }> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdTicketId, setCreatedTicketId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const ticket = await createTicket(formData);
      setCreatedTicketId(ticket.ticket_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear el ticket.");
      setSaving(false);
    }
  }

  if (createdTicketId) {
    return (
      <div className="p-8 max-w-md">
        <div className="card-apple p-8 text-center hover:!transform-none">
          <p className="text-5xl mb-4">🎫</p>
          <h2 className="text-[22px] font-bold text-[var(--text-primary)] mb-2">Ticket creado</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Entrega este número al cliente para que pueda consultar el estado de su equipo.
          </p>
          <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-md)] px-6 py-4 mb-6">
            <p className="text-[28px] font-bold font-mono text-[var(--accent)]">{createdTicketId}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setCreatedTicketId(""); setSaving(false); }}
              className="btn-secondary flex-1"
              id="create-another-ticket"
            >
              Crear otro
            </button>
            <button
              onClick={() => router.push("/admin/servicio-tecnico")}
              className="btn-primary flex-1"
              id="go-to-tickets"
            >
              Ver tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[var(--text-primary)]">Nuevo Ticket</h1>
        <p className="text-[var(--text-secondary)] mt-1">Registra un equipo para reparación.</p>
      </div>

      <form onSubmit={handleSubmit} className="card-apple p-6 hover:!transform-none flex flex-col gap-5">
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-[var(--radius-md)] px-4 py-3 text-[14px]">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="client_name" className="text-[14px] font-medium">Nombre del cliente</label>
          <input
            id="client_name"
            name="client_name"
            type="text"
            required
            placeholder="Juan Pérez"
            className="px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[15px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="user_id" className="text-[14px] font-medium">Vincular cliente registrado <span className="font-normal text-[var(--text-tertiary)]">Opcional</span></label>
          <select id="user_id" name="user_id" defaultValue="" className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
            <option value="">Sin cuenta vinculada</option>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || "Sin nombre"} {profile.phone ? `— ${profile.phone}` : ""}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="client_contact" className="text-[14px] font-medium">Contacto (teléfono o correo)</label>
          <input
            id="client_contact"
            name="client_contact"
            type="text"
            required
             placeholder="09 8765 4321"
            className="px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[15px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="device" className="text-[14px] font-medium">Descripción del equipo</label>
          <input
            id="device"
            name="device"
            type="text"
            required
            placeholder="iPhone 14 Pro — No enciende"
            className="px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[15px]"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            id="submit-new-ticket"
            disabled={saving}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            {saving ? "Creando..." : "Crear Ticket"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

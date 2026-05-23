// Tipos de dominio
export type Rol           = 'cliente' | 'conductor';
export type EstadoBooking = 'pendiente' | 'confirmada' | 'rechazada' | 'completada' | 'cancelada';
export type EstadoTrip    = 'abierto' | 'cerrado';
export type EstadoSpecial = 'pendiente' | 'confirmada' | 'rechazada' | 'completada' | 'cancelada';
export type TipoMaleta    = 'no' | 'maletero' | 'asiento';
export type TipoMascota   = 'no' | 'pies' | 'asiento';
export type FormaPago     = 'efectivo' | 'tarjeta';

// Tipo Database completo para el cliente de Supabase
// Regenerar con `supabase gen types typescript` cuando cambien las tablas.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          rol: Rol;
          nombre: string;
          telefono: string | null;
          direccion_habitual_recogida: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          rol?: Rol;
          nombre?: string;
          telefono?: string | null;
          direccion_habitual_recogida?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          rol?: Rol;
          nombre?: string;
          telefono?: string | null;
          direccion_habitual_recogida?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      conductores: {
        Row: {
          id: string;
          profile_id: string;
          nombre_servicio: string;
          plazas_vehiculo: number;
          stripe_account_id: string | null;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          nombre_servicio: string;
          plazas_vehiculo?: number;
          stripe_account_id?: string | null;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          nombre_servicio?: string;
          plazas_vehiculo?: number;
          stripe_account_id?: string | null;
          activo?: boolean;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          conductor_id: string;
          fecha_hora: string;
          origen_cabecera: string;
          destino_cabecera: string;
          plazas_totales: number;
          plazas_libres: number;
          precio: number;
          estado: EstadoTrip;
          created_at: string;
        };
        Insert: {
          id?: string;
          conductor_id: string;
          fecha_hora: string;
          origen_cabecera: string;
          destino_cabecera: string;
          plazas_totales: number;
          plazas_libres: number;
          precio?: number;
          estado?: EstadoTrip;
          created_at?: string;
        };
        Update: {
          fecha_hora?: string;
          origen_cabecera?: string;
          destino_cabecera?: string;
          plazas_totales?: number;
          plazas_libres?: number;
          precio?: number;
          estado?: EstadoTrip;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          trip_id: string | null;
          conductor_id: string;
          cliente_id: string;
          fecha_hora_solicitada: string | null;
          origen: string;
          destino: string;
          direccion_recogida: string | null;
          direccion_destino: string | null;
          es_noche: boolean;
          precio_base: number;
          maleta: TipoMaleta;
          mascota: TipoMascota;
          suplementos: number;
          precio_total: number;
          forma_pago: FormaPago;
          stripe_payment_intent_id: string | null;
          estado: EstadoBooking;
          cancelada_at: string | null;
          penalizacion: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id?: string | null;
          conductor_id: string;
          cliente_id: string;
          fecha_hora_solicitada?: string | null;
          origen: string;
          destino: string;
          direccion_recogida?: string | null;
          direccion_destino?: string | null;
          es_noche: boolean;
          precio_base: number;
          maleta?: TipoMaleta;
          mascota?: TipoMascota;
          suplementos?: number;
          precio_total: number;
          forma_pago: FormaPago;
          stripe_payment_intent_id?: string | null;
          estado?: EstadoBooking;
          cancelada_at?: string | null;
          penalizacion?: number;
          created_at?: string;
        };
        Update: {
          trip_id?: string | null;
          fecha_hora_solicitada?: string | null;
          origen?: string;
          destino?: string;
          direccion_recogida?: string | null;
          direccion_destino?: string | null;
          es_noche?: boolean;
          precio_base?: number;
          maleta?: TipoMaleta;
          mascota?: TipoMascota;
          suplementos?: number;
          precio_total?: number;
          forma_pago?: FormaPago;
          stripe_payment_intent_id?: string | null;
          estado?: EstadoBooking;
          cancelada_at?: string | null;
          penalizacion?: number;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          }
        ];
      };
      deudas: {
        Row: {
          id: string;
          cliente_id: string;
          conductor_id: string;
          booking_id: string;
          importe: number;
          saldada: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          conductor_id: string;
          booking_id: string;
          importe: number;
          saldada?: boolean;
          created_at?: string;
        };
        Update: {
          importe?: number;
          saldada?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "deudas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      special_requests: {
        Row: {
          id: string;
          conductor_id: string;
          cliente_id: string;
          origen_texto: string;
          destino_texto: string;
          fecha_hora: string;
          num_pasajeros: number;
          precio_propuesto: number | null;
          forma_pago: FormaPago | null;
          stripe_payment_intent_id: string | null;
          estado: EstadoSpecial;
          created_at: string;
        };
        Insert: {
          id?: string;
          conductor_id: string;
          cliente_id: string;
          origen_texto: string;
          destino_texto: string;
          fecha_hora: string;
          num_pasajeros?: number;
          precio_propuesto?: number | null;
          forma_pago?: FormaPago | null;
          stripe_payment_intent_id?: string | null;
          estado?: EstadoSpecial;
          created_at?: string;
        };
        Update: {
          origen_texto?: string;
          destino_texto?: string;
          fecha_hora?: string;
          num_pasajeros?: number;
          precio_propuesto?: number | null;
          forma_pago?: FormaPago | null;
          stripe_payment_intent_id?: string | null;
          estado?: EstadoSpecial;
        };
        Relationships: [];
      };
    };
    Functions: {
      es_conductor_activo: { Args: Record<never, never>; Returns: boolean };
      mi_conductor_id: { Args: Record<never, never>; Returns: string };
    };
    Views: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

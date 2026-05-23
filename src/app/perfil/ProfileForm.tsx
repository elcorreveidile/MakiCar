'use client';
import { useState } from 'react';
import { actualizarPerfil } from './actions';

interface Props {
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  avatarUrl: string | null;
  guardado: boolean;
}

export default function ProfileForm({ nombre, telefono, direccion, avatarUrl, guardado }: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form action={actualizarPerfil} className="flex flex-col gap-3.5">
      {guardado && (
        <div className="bg-[rgba(43,182,164,.12)] border border-[rgba(43,182,164,.3)] text-ruta text-sm rounded-xl px-4 py-3">
          Cambios guardados correctamente.
        </div>
      )}

      {/* Avatar */}
      <div className="flex justify-center mb-2">
        <label className="cursor-pointer relative">
          <div className="w-24 h-24 rounded-full bg-carta border-2 border-linea overflow-hidden flex items-center justify-center">
            {(preview || avatarUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview ?? avatarUrl!}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gris text-4xl">◎</span>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-ambar text-noche w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold leading-none">
            +
          </div>
          <input
            type="file"
            name="avatar"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
          />
        </label>
      </div>
      <p className="text-center text-gris text-xs -mt-1 mb-1">Toca la foto para cambiarla</p>

      <div>
        <label className="block text-gris text-xs mb-1.5">Nombre</label>
        <input
          name="nombre"
          type="text"
          defaultValue={nombre}
          required
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar"
        />
      </div>

      <div>
        <label className="block text-gris text-xs mb-1.5">Teléfono</label>
        <input
          name="telefono"
          type="tel"
          defaultValue={telefono ?? ''}
          placeholder="Ej: +34 600 000 000"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar"
        />
      </div>

      <div>
        <label className="block text-gris text-xs mb-1.5">Dirección habitual de recogida</label>
        <input
          name="direccion"
          type="text"
          defaultValue={direccion ?? ''}
          placeholder="Ej: Calle Mayor 5, Granada"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-ambar text-noche font-bold rounded-xl py-4 text-[15px] active:scale-[.98] transition-transform mt-1"
      >
        Guardar cambios
      </button>
    </form>
  );
}

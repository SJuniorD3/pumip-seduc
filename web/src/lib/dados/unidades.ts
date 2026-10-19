/**
 * PUMIP-SEDUC: Camada de Acesso a Dados — Unidades Organizacionais
 * Centraliza consultas ao organograma institucional da SEDUC-MA.
 */
import { listarUnidadesBanco } from './admin';

export { listarUnidadesBanco };
export const listarUnidades = listarUnidadesBanco;

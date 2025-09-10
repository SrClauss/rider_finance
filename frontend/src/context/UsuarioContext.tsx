"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import axios, { isAxiosError } from "axios";
import { Categoria } from "../interfaces/Categoria";
import { Configuracao } from "@/interfaces/Configuracao";
import { Usuario } from "@/interfaces/Usuario";
import { timeZones, parseUtcToDate, TimeZone, convertToUtc, getCurrentDateTime } from "@/utils/dateUtils";

type UsuarioContextType = {
	categorias: Categoria[];
	setCategorias: React.Dispatch<React.SetStateAction<Categoria[]>>;
	configuracoes: Configuracao [];
	setConfiguracoes: React.Dispatch<React.SetStateAction<Configuracao[]>>;
	usuario: Usuario | null;
	setUsuario: React.Dispatch<React.SetStateAction<Usuario | null>>;
	localtime: TimeZone | null; // Corrigido o tipo para o fuso horário local
	setLocaltime: React.Dispatch<React.SetStateAction<typeof timeZones[keyof typeof timeZones] | null>>;
	formatDateToLocaltime: (utcDate: string) => Date | null; // Adicionado ao tipo
	carregarCategorias: () => Promise<Categoria[]>;
};

const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined);

export const UsuarioProvider = ({ children }: { children: ReactNode }) => {
	const [categorias, setCategorias] = useState<Categoria[]>([]);
	const [configuracoes, setConfiguracoes] = useState<Configuracao[]>([]);
	const [usuario, setUsuario] = useState<Usuario | null>(null);
	const [localtime, setLocaltime] = useState<typeof timeZones[keyof typeof timeZones] | null>(null); // Estado inicial do fuso horário local

	useEffect(() => {
		const fetchUsuario = async () => {
			try {
				const res = await axios.get<Usuario>("/api/me", { withCredentials: true });
				setUsuario(res.data);
			} catch (error: unknown) {
				if (isAxiosError(error) && error.response?.status === 401) {
					// Erro 401 tratado silenciosamente
					setUsuario(null);
				} else {
					// Logar apenas erros inesperados
					console.debug("Erro inesperado ao buscar usuário:", error);
				}
			}
		};
		fetchUsuario();
	}, []);

	useEffect(() => {
		if (usuario) {
			const fetchCategoriasEConfiguracoes = async () => {
				try {
					const cats = await carregarCategorias();
					setCategorias(cats);

					const config = await carregarConfiguracao(usuario.id);
					if (!config.find((c) => c.chave === "timezone")) {
						const configuracao: Configuracao = {
							id: "",
							id_usuario: usuario.id,
							chave: "timezone",
							valor: "America/Sao_Paulo (UTC-03:00)",
							eh_publica: false,
							criado_em: getCurrentDateTime(timeZones["UTC±00:00"]).toISOString(),
							atualizado_em: getCurrentDateTime(timeZones["UTC±00:00"]).toISOString(),
						};
						try {
							const res = await axios.post<Configuracao>("/api/configuracao", configuracao, { withCredentials: true });
							config.push(res.data);
							setConfiguracoes(config);
							setLocaltime(timeZones[res.data.valor as keyof typeof timeZones]);
						} catch (error) {
							console.error("Erro ao criar configuração de timezone:", error);
						}
					}
					setConfiguracoes(config);
				} catch (error) {
					console.error("Erro ao carregar categorias ou configurações:", error);
				}
			};
			fetchCategoriasEConfiguracoes();
		}
	}, [usuario]);

	const formatDateToLocaltime = (utcDate: string): Date | null => {
		if (!localtime) return null;
		return parseUtcToDate(utcDate, localtime);
	};

	return (
		<UsuarioContext.Provider value={{ categorias, setCategorias, configuracoes, setConfiguracoes, usuario, setUsuario, localtime, setLocaltime, formatDateToLocaltime, carregarCategorias }}>
			{children}
		</UsuarioContext.Provider>
	);
};

export function useUsuarioContext() {
	const ctx = useContext(UsuarioContext);
	if (!ctx) throw new Error("useUsuarioContext deve ser usado dentro do UsuarioProvider");
	return ctx;
}

export async function carregarCategorias(): Promise<Categoria[]> {
	try {
		const res = await axios.get<Categoria[]>("/api/categorias", { withCredentials: true });
		return res.data;
	} catch (error: unknown) {
		if (isAxiosError(error) && error.response?.status === 401) {
			// Erro 401 tratado silenciosamente
			return [];
		} else {
			// Logar apenas erros inesperados
			console.debug("Erro inesperado ao carregar categorias:", error);
			return [];
		}
	}
}
export async function carregarConfiguracao(id_usuario: string): Promise<Configuracao[]> {
	try {
		const res = await axios.get<Configuracao[]>(`/api/configuracao/user/${id_usuario}`, { withCredentials: true });
		return res.data;
	} catch (error) {
		console.error("Erro ao carregar configurações:", error);
		return [];
	}
}

export async function me(): Promise<Usuario | null> {
	try {
		const res = await axios.get<Usuario>("/api/me", { withCredentials: true });
		return res.data;
	} catch (error) {
		console.error("Erro ao buscar usuário:", error);
		return null;
	}
}


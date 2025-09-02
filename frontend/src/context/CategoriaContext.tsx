"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import axios from "axios";
import { Categoria } from "../interfaces/Categoria";

type CategoriaContextType = {
	categorias: Categoria[];
	setCategorias: React.Dispatch<React.SetStateAction<Categoria[]>>;
};

const CategoriaContext = createContext<CategoriaContextType | undefined>(undefined);

export const CategoriaProvider = ({ children }: { children: ReactNode }) => {
	const [categorias, setCategorias] = useState<Categoria[]>([]);

	useEffect(() => {
		// Carrega categorias ao montar o provider para que todos os componentes tenham acesso
		async function init() {
			try {
				const res = await carregarCategorias();
				setCategorias(res);
			} catch (e) {
				console.warn('Falha ao carregar categorias no provider:', e);
			}
		}
		init();
	}, []);

	return (
		<CategoriaContext.Provider value={{ categorias, setCategorias }}>
			{children}
		</CategoriaContext.Provider>
	);
};

export function useCategoriaContext() {
	const ctx = useContext(CategoriaContext);
	if (!ctx) throw new Error("useCategoriaContext deve ser usado dentro do CategoriaProvider");
	return ctx;
}

export async function carregarCategorias(): Promise<Categoria[]> {
	const res = await axios.get<Categoria[]>("/api/categorias", { withCredentials: true });


	return res.data;
}

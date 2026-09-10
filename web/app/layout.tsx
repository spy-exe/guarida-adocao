import type { Metadata } from "next";
import { Azeret_Mono, Fraunces, Karla } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--fonte-fraunces",
  display: "swap"
});

const texto = Karla({
  subsets: ["latin"],
  variable: "--fonte-karla",
  display: "swap"
});

const mono = Azeret_Mono({
  subsets: ["latin"],
  variable: "--fonte-azeret",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Guarida - abrigo e adocao",
  description:
    "Catalogo de animais para adocao e painel do abrigo: cadastro, consulta, alteracao e exclusao."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${texto.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

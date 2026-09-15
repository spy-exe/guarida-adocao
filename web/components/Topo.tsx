import Link from "next/link";
import Marca from "@/components/Marca";

export default function Topo({ complemento, children }: { complemento?: string; children?: React.ReactNode }) {
  return (
    <header className="topo">
      <div className="topo-miolo">
        <Link href="/" aria-label="Guarida, página inicial">
          <Marca complemento={complemento} />
        </Link>
        <nav className="topo-nav">{children}</nav>
      </div>
    </header>
  );
}

package br.com.ricardofigueiredo.guarida.candidatura;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import br.com.ricardofigueiredo.guarida.animal.Animal;
import br.com.ricardofigueiredo.guarida.animal.Especie;
import br.com.ricardofigueiredo.guarida.animal.Porte;
import br.com.ricardofigueiredo.guarida.animal.Sexo;
import br.com.ricardofigueiredo.guarida.comum.excecao.RegraDeNegocioException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CandidaturaTest {

    @Test
    @DisplayName("a candidatura nasce recebida e em aberto")
    void nasceRecebida() {
        Candidatura candidatura = nova();

        assertThat(candidatura.getStatus()).isEqualTo(StatusDaCandidatura.RECEBIDA);
        assertThat(candidatura.estaEmAberto()).isTrue();
    }

    @Test
    @DisplayName("colocar em analise mantem a candidatura em aberto")
    void analise() {
        Candidatura candidatura = nova();
        candidatura.colocarEmAnalise();

        assertThat(candidatura.getStatus()).isEqualTo(StatusDaCandidatura.EM_ANALISE);
        assertThat(candidatura.estaEmAberto()).isTrue();
    }

    @Test
    @DisplayName("aprovar fecha a candidatura e limpa qualquer motivo de recusa")
    void aprovacao() {
        Candidatura candidatura = nova();
        candidatura.aprovar();

        assertThat(candidatura.getStatus()).isEqualTo(StatusDaCandidatura.APROVADA);
        assertThat(candidatura.getMotivoDaRecusa()).isNull();
        assertThat(candidatura.estaEmAberto()).isFalse();
    }

    @Test
    @DisplayName("recusa sem motivo nao passa, porque nao ajuda quem recebeu")
    void recusaExigeMotivo() {
        assertThatThrownBy(() -> nova().recusar("  "))
                .isInstanceOf(RegraDeNegocioException.class)
                .hasMessageContaining("motivo");

        assertThatThrownBy(() -> nova().recusar(null))
                .isInstanceOf(RegraDeNegocioException.class);
    }

    @Test
    @DisplayName("recusa guarda o motivo sem espaco sobrando")
    void recusaGuardaOMotivo() {
        Candidatura candidatura = nova();
        candidatura.recusar("  mora longe demais para o acompanhamento  ");

        assertThat(candidatura.getStatus()).isEqualTo(StatusDaCandidatura.RECUSADA);
        assertThat(candidatura.getMotivoDaRecusa()).isEqualTo("mora longe demais para o acompanhamento");
    }

    @Test
    @DisplayName("candidatura ja fechada nao muda mais de estado")
    void fechadaNaoMuda() {
        Candidatura aprovada = nova();
        aprovada.aprovar();

        assertThatThrownBy(aprovada::colocarEmAnalise).isInstanceOf(RegraDeNegocioException.class);
        assertThatThrownBy(aprovada::aprovar).isInstanceOf(RegraDeNegocioException.class);
        assertThatThrownBy(() -> aprovada.recusar("qualquer")).isInstanceOf(RegraDeNegocioException.class);
    }

    @Test
    @DisplayName("cancelar so mexe em quem esta em aberto, e nao reclama do resto")
    void cancelamento() {
        Candidatura emAberto = nova();
        emAberto.cancelar();
        assertThat(emAberto.getStatus()).isEqualTo(StatusDaCandidatura.CANCELADA);

        Candidatura aprovada = nova();
        aprovada.aprovar();
        aprovada.cancelar();
        assertThat(aprovada.getStatus()).isEqualTo(StatusDaCandidatura.APROVADA);
    }

    private Candidatura nova() {
        Abrigo abrigo = new Abrigo("Abrigo", "abrigo@exemplo.com", "hash", "Niteroi", null);
        Animal animal = new Animal(abrigo, "Bidu", Especie.CACHORRO, "SRD", Sexo.MACHO, Porte.MEDIO,
                LocalDate.now().minusYears(2), 15000, LocalDate.now().minusMonths(1));

        return new Candidatura(animal, "Maria", "maria@exemplo.com", "21999998888", "Niteroi",
                TipoDeMoradia.APARTAMENTO, true, false, "Moro sozinha e trabalho de casa");
    }
}

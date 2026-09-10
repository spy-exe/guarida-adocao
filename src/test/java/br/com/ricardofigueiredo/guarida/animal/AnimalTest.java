package br.com.ricardofigueiredo.guarida.animal;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import br.com.ricardofigueiredo.guarida.comum.excecao.RegraDeNegocioException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AnimalTest {

    @Test
    @DisplayName("animal recem cadastrado ja nasce disponivel para adocao")
    void nasceDisponivel() {
        Animal animal = novo();

        assertThat(animal.getStatus()).isEqualTo(StatusAnimal.DISPONIVEL);
        assertThat(animal.getTemperamentos()).isEmpty();
    }

    @Test
    @DisplayName("a idade sai do nascimento estimado, em meses cheios")
    void calculaAIdade() {
        Animal doisAnosEMeio = comNascimento(LocalDate.now().minusMonths(30));
        Animal deTresMeses = comNascimento(LocalDate.now().minusMonths(3));

        assertThat(doisAnosEMeio.idadeEmMeses()).isEqualTo(30);
        assertThat(doisAnosEMeio.filhote()).isFalse();
        assertThat(deTresMeses.idadeEmMeses()).isEqualTo(3);
        assertThat(deTresMeses.filhote()).isTrue();
    }

    @Test
    @DisplayName("animal nascido hoje tem idade zero, e nao negativa")
    void idadeNuncaFicaNegativa() {
        assertThat(comNascimento(LocalDate.now()).idadeEmMeses()).isZero();
    }

    @Test
    @DisplayName("editar troca os dados e guarda os tracos de temperamento")
    void editaOCadastro() {
        Animal animal = novo();

        animal.editar("Amora", Especie.GATO, "SRD", Sexo.FEMEA, Porte.PEQUENO,
                LocalDate.now().minusYears(2), 3800, "Resgatada na chuva", "Precisa de dieta",
                true, true, true, Set.of(Temperamento.DOCIL, Temperamento.TIMIDO));

        assertThat(animal.getNome()).isEqualTo("Amora");
        assertThat(animal.getEspecie()).isEqualTo(Especie.GATO);
        assertThat(animal.isCastrado()).isTrue();
        assertThat(animal.getTemperamentos())
                .containsExactlyInAnyOrder(Temperamento.DOCIL, Temperamento.TIMIDO);
        assertThat(animal.getAtualizadoEm()).isAfterOrEqualTo(animal.getCriadoEm());
    }

    @Test
    @DisplayName("editar sem tracos limpa a lista em vez de estourar")
    void editaSemTracos() {
        Animal animal = novo();
        animal.editar("Bidu", Especie.CACHORRO, null, Sexo.MACHO, Porte.MEDIO,
                LocalDate.now().minusYears(3), 15000, null, null, false, false, false, null);

        assertThat(animal.getTemperamentos()).isEmpty();
        assertThat(animal.getRaca()).isNull();
    }

    @Test
    @DisplayName("a lista de tracos devolvida e uma copia, e nao a colecao interna")
    void tracosNaoVazamPorReferencia() {
        Animal animal = novo();
        animal.editar("Bidu", Especie.CACHORRO, null, Sexo.MACHO, Porte.MEDIO,
                LocalDate.now().minusYears(3), 15000, null, null, false, false, false,
                Set.of(Temperamento.CALMO));

        var copia = animal.getTemperamentos();
        copia.clear();

        assertThat(animal.getTemperamentos()).containsExactly(Temperamento.CALMO);
    }

    @Test
    @DisplayName("aprovar uma candidatura reserva o animal")
    void reserva() {
        Animal animal = novo();
        animal.reservar();

        assertThat(animal.getStatus()).isEqualTo(StatusAnimal.EM_PROCESSO);
    }

    @Test
    @DisplayName("nao da para reservar duas vezes")
    void naoReservaDuasVezes() {
        Animal animal = novo();
        animal.reservar();

        assertThatThrownBy(animal::reservar)
                .isInstanceOf(RegraDeNegocioException.class)
                .hasMessageContaining("Em processo");
    }

    @Test
    @DisplayName("a adocao so fecha depois da reserva")
    void adocaoExigeReserva() {
        Animal animal = novo();

        assertThatThrownBy(animal::concluirAdocao)
                .isInstanceOf(RegraDeNegocioException.class)
                .hasMessageContaining("aprovar uma candidatura");

        animal.reservar();
        animal.concluirAdocao();
        assertThat(animal.getStatus()).isEqualTo(StatusAnimal.ADOTADO);
    }

    @Test
    @DisplayName("animal adotado volta para a vitrine por devolucao")
    void devolucaoVoltaParaAVitrine() {
        Animal animal = novo();
        animal.reservar();
        animal.concluirAdocao();
        animal.devolverParaAdocao();

        assertThat(animal.getStatus()).isEqualTo(StatusAnimal.DISPONIVEL);
    }

    @Test
    @DisplayName("devolver quem ja esta disponivel nao faz sentido")
    void naoDevolveQuemJaEstaDisponivel() {
        assertThatThrownBy(() -> novo().devolverParaAdocao())
                .isInstanceOf(RegraDeNegocioException.class)
                .hasMessageContaining("ja esta disponivel");
    }

    @Test
    @DisplayName("suspender tira da vitrine, e adotado nao pode ser suspenso")
    void suspensao() {
        Animal animal = novo();
        animal.suspender();
        assertThat(animal.getStatus()).isEqualTo(StatusAnimal.INDISPONIVEL);

        Animal adotado = novo();
        adotado.reservar();
        adotado.concluirAdocao();

        assertThatThrownBy(adotado::suspender)
                .isInstanceOf(RegraDeNegocioException.class)
                .hasMessageContaining("adotado");
    }

    @Test
    @DisplayName("animal adotado nao pode ser excluido, para nao apagar a adocao")
    void adotadoNaoSeExclui() {
        Animal animal = novo();
        assertThatCode(animal::exigirQuePodeSerExcluido).doesNotThrowAnyException();

        animal.reservar();
        assertThatCode(animal::exigirQuePodeSerExcluido).doesNotThrowAnyException();

        animal.concluirAdocao();
        assertThatThrownBy(animal::exigirQuePodeSerExcluido)
                .isInstanceOf(RegraDeNegocioException.class)
                .hasMessageContaining("registre a devolucao");
    }

    private Animal novo() {
        return comNascimento(LocalDate.now().minusYears(2));
    }

    private Animal comNascimento(LocalDate nascimento) {
        Abrigo abrigo = new Abrigo("Abrigo Sao Francisco", "abrigo@exemplo.com", "hash",
                "Niteroi", "21999998888");
        return new Animal(abrigo, "Bidu", Especie.CACHORRO, "SRD", Sexo.MACHO, Porte.MEDIO,
                nascimento, 15000, LocalDate.now().minusMonths(1));
    }
}

package br.com.ricardofigueiredo.guarida.animal;

/**
 * Situacao do animal dentro do abrigo.
 *
 * DISPONIVEL   -> EM_PROCESSO | INDISPONIVEL
 * EM_PROCESSO  -> ADOTADO | DISPONIVEL
 * ADOTADO      -> DISPONIVEL, apenas em caso de devolucao
 * INDISPONIVEL -> DISPONIVEL
 *
 * As transicoes estao implementadas na propria entidade Animal, para que
 * nenhuma camada consiga gravar um estado que o abrigo nao conseguiria
 * explicar para quem perguntar.
 */
public enum StatusAnimal {

    DISPONIVEL("Disponivel para adocao"),
    EM_PROCESSO("Em processo de adocao"),
    ADOTADO("Adotado"),
    INDISPONIVEL("Indisponivel no momento");

    private final String rotulo;

    StatusAnimal(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}

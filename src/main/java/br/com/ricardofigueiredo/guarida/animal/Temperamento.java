package br.com.ricardofigueiredo.guarida.animal;

/**
 * Tracos que ajudam quem procura a encontrar o animal certo. Nao sao
 * diagnostico, sao a leitura de quem convive com ele no abrigo.
 */
public enum Temperamento {

    DOCIL("Docil"),
    BRINCALHAO("Brincalhao"),
    TIMIDO("Timido"),
    CALMO("Calmo"),
    AGITADO("Agitado"),
    PROTETOR("Protetor"),
    SOCIAVEL_COM_CAES("Se da bem com caes"),
    SOCIAVEL_COM_GATOS("Se da bem com gatos"),
    BOM_COM_CRIANCAS("Bom com criancas"),
    PRECISA_DE_ESPACO("Precisa de espaco");

    private final String rotulo;

    Temperamento(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}

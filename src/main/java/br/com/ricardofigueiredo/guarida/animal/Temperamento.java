package br.com.ricardofigueiredo.guarida.animal;

/**
 * Tracos que ajudam quem procura a encontrar o animal certo. Nao sao
 * diagnostico, sao a leitura de quem convive com ele no abrigo.
 */
public enum Temperamento {

    DOCIL("Dócil"),
    BRINCALHAO("Brincalhão"),
    TIMIDO("Tímido"),
    CALMO("Calmo"),
    AGITADO("Agitado"),
    PROTETOR("Protetor"),
    SOCIAVEL_COM_CAES("Se da bem com cães"),
    SOCIAVEL_COM_GATOS("Se da bem com gatos"),
    BOM_COM_CRIANCAS("Bom com crianças"),
    PRECISA_DE_ESPACO("Precisa de espaço");

    private final String rotulo;

    Temperamento(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}

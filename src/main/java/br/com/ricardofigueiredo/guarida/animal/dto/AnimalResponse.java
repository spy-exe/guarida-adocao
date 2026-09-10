package br.com.ricardofigueiredo.guarida.animal.dto;

import br.com.ricardofigueiredo.guarida.animal.Animal;
import br.com.ricardofigueiredo.guarida.animal.Especie;
import br.com.ricardofigueiredo.guarida.animal.Porte;
import br.com.ricardofigueiredo.guarida.animal.Sexo;
import br.com.ricardofigueiredo.guarida.animal.StatusAnimal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AnimalResponse(
        Long id,
        String nome,
        Especie especie,
        String especieRotulo,
        String raca,
        Sexo sexo,
        String sexoRotulo,
        Porte porte,
        String porteRotulo,
        LocalDate nascimentoEstimado,
        int idadeEmMeses,
        String idadeRotulo,
        boolean filhote,
        int pesoEmGramas,
        boolean castrado,
        boolean vacinado,
        boolean vermifugado,
        String historia,
        String observacoesDeSaude,
        StatusAnimal status,
        String statusRotulo,
        LocalDate dataDeEntrada,
        List<TemperamentoResponse> temperamentos,
        AbrigoResumo abrigo,
        Instant criadoEm,
        Instant atualizadoEm) {

    public record TemperamentoResponse(String chave, String rotulo) {
    }

    public record AbrigoResumo(Long id, String nome, String cidade) {
    }

    public static AnimalResponse de(Animal animal) {
        return new AnimalResponse(
                animal.getId(),
                animal.getNome(),
                animal.getEspecie(),
                animal.getEspecie().getRotulo(),
                animal.getRaca(),
                animal.getSexo(),
                animal.getSexo().getRotulo(),
                animal.getPorte(),
                animal.getPorte().getRotulo(),
                animal.getNascimentoEstimado(),
                animal.idadeEmMeses(),
                idadeEmPalavras(animal.idadeEmMeses()),
                animal.filhote(),
                animal.getPesoEmGramas(),
                animal.isCastrado(),
                animal.isVacinado(),
                animal.isVermifugado(),
                animal.getHistoria(),
                animal.getObservacoesDeSaude(),
                animal.getStatus(),
                animal.getStatus().getRotulo(),
                animal.getDataDeEntrada(),
                animal.getTemperamentos().stream()
                        .map(traco -> new TemperamentoResponse(traco.name(), traco.getRotulo()))
                        .toList(),
                new AbrigoResumo(animal.getAbrigo().getId(), animal.getAbrigo().getNome(),
                        animal.getAbrigo().getCidade()),
                animal.getCriadoEm(),
                animal.getAtualizadoEm());
    }

    /** "1 ano e 3 meses" comunica melhor que "15 meses" na ficha do animal. */
    static String idadeEmPalavras(int meses) {
        if (meses < 1) {
            return "recem-nascido";
        }
        if (meses < 12) {
            return meses + (meses == 1 ? " mes" : " meses");
        }

        int anos = meses / 12;
        int resto = meses % 12;
        String parteDoAno = anos + (anos == 1 ? " ano" : " anos");

        if (resto == 0) {
            return parteDoAno;
        }
        return parteDoAno + " e " + resto + (resto == 1 ? " mes" : " meses");
    }
}

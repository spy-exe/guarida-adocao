package br.com.ricardofigueiredo.guarida.foto;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import br.com.ricardofigueiredo.guarida.animal.AnimalService;
import br.com.ricardofigueiredo.guarida.comum.excecao.RecursoNaoEncontradoException;
import br.com.ricardofigueiredo.guarida.comum.excecao.RegraDeNegocioException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
public class FotoService {

    /**
     * Dois megabytes bastam para uma foto de 1600 pixels bem comprimida. Acima
     * disso quase sempre e foto direto da camera, que o catalogo nao precisa.
     */
    public static final int TAMANHO_MAXIMO = 2 * 1024 * 1024;

    private final FotoRepository fotoRepository;
    private final AnimalService animalService;

    public FotoService(FotoRepository fotoRepository, AnimalService animalService) {
        this.fotoRepository = fotoRepository;
        this.animalService = animalService;
    }

    @Transactional
    public FotoDoAnimal enviar(Abrigo abrigo, Long animalId, byte[] conteudo, String autor, String licenca,
                               String fonte) {
        animalService.buscarDoAbrigo(abrigo, animalId);

        if (conteudo == null || conteudo.length == 0) {
            throw new RegraDeNegocioException("Envie o arquivo da foto.");
        }
        if (conteudo.length > TAMANHO_MAXIMO) {
            throw new RegraDeNegocioException("A foto pode ter no máximo 2 MB.");
        }

        TipoDeImagem tipo = TipoDeImagem.reconhecer(conteudo)
                .orElseThrow(() -> new RegraDeNegocioException(
                        "O arquivo não é uma imagem JPEG, PNG ou WEBP."));

        String origem = limpar(fonte, 300);
        // o link aparece como href na ficha pública; qualquer esquema fora de http abriria porta para script
        if (origem != null && !origem.matches("(?i)^https?://\\S+$")) {
            throw new RegraDeNegocioException("O link da origem precisa começar com http:// ou https://.");
        }

        FotoDoAnimal foto = fotoRepository.findById(animalId).orElseGet(() -> new FotoDoAnimal(animalId));
        foto.trocar(conteudo, tipo, versaoDe(conteudo), limpar(autor, 160), limpar(licenca, 60), origem);

        return fotoRepository.save(foto);
    }

    @Transactional(readOnly = true)
    public FotoDoAnimal buscar(Long animalId) {
        return fotoRepository.findById(animalId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "O animal " + animalId + " não tem foto."));
    }

    @Transactional
    public void remover(Abrigo abrigo, Long animalId) {
        animalService.buscarDoAbrigo(abrigo, animalId);
        fotoRepository.deleteById(animalId);
    }

    static String versaoDe(byte[] conteudo) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(conteudo);
            return HexFormat.of().formatHex(hash, 0, 8);
        } catch (NoSuchAlgorithmException excecao) {
            throw new IllegalStateException("SHA-256 deveria existir em qualquer JVM", excecao);
        }
    }

    static String limpar(String texto, int limite) {
        if (texto == null || texto.isBlank()) {
            return null;
        }
        String aparado = texto.trim();
        return aparado.length() <= limite ? aparado : aparado.substring(0, limite);
    }
}

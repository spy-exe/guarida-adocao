package br.com.ricardofigueiredo.guarida.foto;

import java.util.Arrays;
import java.util.Optional;

/**
 * Formatos aceitos, reconhecidos pelos primeiros bytes do arquivo.
 *
 * O tipo declarado no upload e a extensao do nome sao escolhidos por quem envia
 * e nao provam nada: um script renomeado para .jpg chega dizendo image/jpeg.
 * A assinatura no comeco do arquivo e o que o proprio decodificador de imagem
 * vai ler, entao e ela que decide.
 */
public enum TipoDeImagem {

    JPEG("image/jpeg"),
    PNG("image/png"),
    WEBP("image/webp");

    private static final byte[] ASSINATURA_JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] ASSINATURA_PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};

    private final String mime;

    TipoDeImagem(String mime) {
        this.mime = mime;
    }

    public String mime() {
        return mime;
    }

    public static Optional<TipoDeImagem> reconhecer(byte[] conteudo) {
        if (conteudo == null) {
            return Optional.empty();
        }
        if (comecaCom(conteudo, ASSINATURA_JPEG)) {
            return Optional.of(JPEG);
        }
        if (comecaCom(conteudo, ASSINATURA_PNG)) {
            return Optional.of(PNG);
        }
        // WEBP e um conteiner RIFF: "RIFF", quatro bytes de tamanho, e "WEBP"
        if (conteudo.length >= 12
                && conteudo[0] == 'R' && conteudo[1] == 'I' && conteudo[2] == 'F' && conteudo[3] == 'F'
                && conteudo[8] == 'W' && conteudo[9] == 'E' && conteudo[10] == 'B' && conteudo[11] == 'P') {
            return Optional.of(WEBP);
        }
        return Optional.empty();
    }

    private static boolean comecaCom(byte[] conteudo, byte[] assinatura) {
        return conteudo.length >= assinatura.length
                && Arrays.equals(conteudo, 0, assinatura.length, assinatura, 0, assinatura.length);
    }
}

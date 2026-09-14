package br.com.ricardofigueiredo.guarida.foto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class TipoDeImagemTest {

    @Test
    @DisplayName("reconhece JPEG, PNG e WEBP pelos primeiros bytes")
    void reconheceAssinaturas() {
        assertThat(TipoDeImagem.reconhecer(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00}))
                .contains(TipoDeImagem.JPEG);
        assertThat(TipoDeImagem.reconhecer(new byte[]{(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n', 0}))
                .contains(TipoDeImagem.PNG);
        assertThat(TipoDeImagem.reconhecer("RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.ISO_8859_1)))
                .contains(TipoDeImagem.WEBP);
    }

    @Test
    @DisplayName("nome de arquivo mentindo nao engana: script continua sendo script")
    void recusaOQueNaoEImagem() {
        assertThat(TipoDeImagem.reconhecer("#!/bin/sh\nrm -rf /".getBytes(StandardCharsets.UTF_8))).isEmpty();
        assertThat(TipoDeImagem.reconhecer("<svg onload=alert(1)>".getBytes(StandardCharsets.UTF_8))).isEmpty();
        assertThat(TipoDeImagem.reconhecer("RIFF\0\0\0\0WAVEfmt ".getBytes(StandardCharsets.ISO_8859_1))).isEmpty();
    }

    @Test
    @DisplayName("arquivo vazio, nulo ou curto demais nao vira imagem")
    void recusaBytesInsuficientes() {
        assertThat(TipoDeImagem.reconhecer(null)).isEmpty();
        assertThat(TipoDeImagem.reconhecer(new byte[0])).isEmpty();
        assertThat(TipoDeImagem.reconhecer(new byte[]{(byte) 0xFF, (byte) 0xD8})).isEmpty();
        assertThat(TipoDeImagem.reconhecer("RIFF".getBytes(StandardCharsets.ISO_8859_1))).isEmpty();
    }

    @Test
    @DisplayName("cada tipo sabe o proprio mime")
    void mime() {
        assertThat(TipoDeImagem.JPEG.mime()).isEqualTo("image/jpeg");
        assertThat(TipoDeImagem.PNG.mime()).isEqualTo("image/png");
        assertThat(TipoDeImagem.WEBP.mime()).isEqualTo("image/webp");
    }

    @Test
    @DisplayName("a versao muda quando o conteudo muda, e credito longo e cortado")
    void auxiliaresDoServico() {
        assertThat(FotoService.versaoDe(new byte[]{1, 2, 3})).hasSize(16)
                .isNotEqualTo(FotoService.versaoDe(new byte[]{1, 2, 4}));
        assertThat(FotoService.limpar(null, 10)).isNull();
        assertThat(FotoService.limpar("   ", 10)).isNull();
        assertThat(FotoService.limpar("  Ana  ", 10)).isEqualTo("Ana");
        assertThat(FotoService.limpar("abcdefghijkl", 5)).isEqualTo("abcde");
    }
}

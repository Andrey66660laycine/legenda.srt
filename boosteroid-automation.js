const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');

// Configurações do Chrome
let options = new chrome.Options();
options.addArguments("--start-maximized"); // Maximiza a janela do navegador

// Função para gerar chave aleatória
function generateRandomKey() {
    let partLengths = [32, 34, 32];
    let keyParts = partLengths.map(length =>
        Array.from({ length: length }, () =>
            Math.random().toString(16).charAt(2).toUpperCase()
        ).join('')
    );
    let randomKey = keyParts.join('\n');
    return randomKey;
}

// Função principal
async function main() {
    let numKeys = parseInt(prompt("Quantas chaves você deseja gerar?"));
    let keys = Array.from({ length: numKeys }, generateRandomKey);

    let email = prompt("Digite seu email do Boosteroid:");
    let password = prompt("Digite sua senha do Boosteroid:");

    // Criação do driver
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // Acesso à página de login
        await driver.get('https://cloud.boosteroid.com/auth/login');
        await driver.sleep(3000); // Aguarda a página carregar completamente

        // Preenchimento dos campos de login
        let emailField = await driver.findElement(By.id('authLoginEmailField'));
        let passwordField = await driver.findElement(By.id('authLoginPasswordField'));
        let loginButton = await driver.findElement(By.className('primary-button'));

        await emailField.sendKeys(email);
        await passwordField.sendKeys(password);
        await loginButton.click();

        await driver.sleep(5000); // Aguarda o login ser concluído

        // Verifica se estamos no Dashboard após o login
        if (await driver.getCurrentUrl().includes('dashboard')) {
            // Se estiver no Dashboard, navega para a página principal de perfil
            await driver.get('https://cloud.boosteroid.com/profile/account/main');
            await driver.sleep(5000); // Aguarda a página carregar completamente
        }

        let keyAccepted = false;

        // Tenta cada chave gerada até encontrar uma válida
        for (let key of keys) {
            if (keyAccepted) break; // Se uma chave válida já foi encontrada, sai do loop

            // Encontra o campo de inserção de chave (activation code)
            let activationCodeField = await driver.findElement(By.css('input.promo__input[placeholder="Activation code"]'));

            // Limpa o campo e insere a chave gerada
            await activationCodeField.clear();
            await activationCodeField.sendKeys(key);

            // Exibe a chave sendo tentada no console
            console.log(`Tentando chave: ${key}`);

            // Encontra e clica no botão de ativação
            let activateButton = await driver.findElement(By.xpath('//button[contains(@class, "button-primary") and contains(@class, "ng-tns-c2201485858-11")]'));
            await activateButton.click();

            await driver.sleep(2000); // Aguarda a resposta

            // Verifica se há uma mensagem de erro de chave inválida
            let errorMessages = await driver.findElements(By.xpath('//span[contains(@class, "error-line") and contains(@class, "ng-tns-c2201485858-11")]'));
            if (errorMessages.length === 0) {
                // Verifica se a chave foi aceita com sucesso
                if (await driver.getPageSource().includes('Chave aceita com sucesso')) {
                    console.log(`Chave ${key}|ACEITO`); // Chave aceita, imprime no console
                    keyAccepted = true;
                }
            } else {
                console.log(`Chave ${key}|NEGADO`); // Chave negada, imprime no console
            }
        }

        if (!keyAccepted) {
            console.log('Nenhuma chave válida encontrada.');
        }
    } finally {
        await driver.quit();
    }
}

// Chama a função principal ao carregar a página
main().catch(console.error);

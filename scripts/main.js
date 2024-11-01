
window.onload = () => {
    // Habilitando Popovers;
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));

    renderHome();
}

// Função para ler o arquivo JSON enviado
function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (file && file.type === "application/json") {
        const reader = new FileReader();
        
        // Função que será chamada quando o arquivo for lido
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                characterTest(jsonData);
                // appendAlert('Sucesso! A ficha carregará em instantes!', 'success');
            } catch (error) {
                console.error('Erro ao ler o arquivo JSON:', error);
                alert('Arquivo inválido. Certifique-se de que é um JSON válido.');
            }
        };
        // Ler o conteúdo do arquivo
        reader.readAsText(file);
    } else {
        alert('Por favor, envie um arquivo JSON válido.');
    }
}

/**
* 
* @param {portfolio} portfolio 
*/
function characterTest(portfolio) {
    let portfolioData = getPortData(portfolio);
    
    for(let portData of portfolioData) {
        if(!portData.data) {
            $('#load-error-modal').modal('show');
            return;
        }
    }
    
    currentPortfolio = portfolioData;
    
    renderSheetList();
}

/**
* Salva a ficha para modelo PDF.
*/
function saveToPDF() {
    
    const options = {
        margin: [0, 0, 0, 0], // Remove margens
        filename: (currentCharacter ? `${currentCharacter.data.name}.pdf` : `Ficha de Personagem.pdf`),
        html2canvas: { scale: 2 },
        image: { type: 'jpeg', quality: 0.98 },
        pageBreak: { mode: 'css' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    
    let sheetExport = document.createElement('div');
    
    let clonedNode;
    let sheets = Array.from(document.querySelectorAll(`#sheet-container .a4-page`));
    
    for (let index = 0; index < sheets.length; index++) {
        clonedNode = sheets[index].cloneNode(true);
        
        // Reestrutura os divs para o modelo sem posicionamento absoluto e escala
        clonedNode.style.position = 'static'; // Posicionamento normal
        clonedNode.style.transform = 'none';
        clonedNode.style.transformOrigin = 'none';
        
        // Garantir que page-break-inside: avoid funcione
        clonedNode.style.pageBreakInside = 'avoid';
        
        sheetExport.appendChild(clonedNode);
        
        // Não adicionar divisor ou espaçamento entre as fichas
    }
    
    html2pdf().set(options).from(sheetExport).save();
    
    // Remover o elemento após a exportação
    sheetExport.remove();
}

/**
* Recebe uma lista de poderes e "espalha" ela: coloca Poderes de Múltiplos Poderes e 
* Efeitos Alternativos lado a lado dos poderes "pai".
* @param {Power[]} powers Lista de Poderes.
* @returns {Power[]} Lista de poderes "espalhada."
*/
function spreadPowers(powers) {
    const spreadArray = [];
    
    powers.forEach((power) => {
        // Adiciona o poder principal
        spreadArray.push(power);
        
        // Se existirem Poderes dentro, chama a função recursivamente
        if (power.powers) {
            const childPowers = spreadPowers(power.powers).map((child) => ({
                ...child,
                name: `> ${child.name}`,
            }));
            spreadArray.push(...childPowers);
        }
        
        // Se existirem efeitos alternativos, chama a função recursivamente
        if (power.alternativeEffects) {
            const alternativePowers = spreadPowers(power.alternativeEffects).map((alternative) => ({
                ...alternative,
                name: `> ${alternative.name}`,
            }));
            spreadArray.push(...alternativePowers);
        }
    });
    
    return spreadArray;
}

/**
* Espalha os Equipamentos em uma única lista, tirando de campos de poderes e lista de equipamentos.
* @param {EquipmentData[]} equipments Lista de Equipamentos
* @returns {EquipmentData[]}
*/
function spreadEquipments(equipments) {
    const spreadArray = [];
    
    equipments.forEach((equipment) => {
        // Adiciona o poder principal
        spreadArray.push(equipment);
        
        // Se existirem efeitos alternativos, chama a função recursivamente
        if (equipment.equipList) {
            const extraEquips = spreadEquipments(equipment.equipList).map((equip) => ({
                ...equip,
                name: `> ${equip.name}`,
            }));
            spreadArray.push(...extraEquips);
        }
    });
    
    return spreadArray;
}

/**
* Adiciona dinamicamente elementos HTML enquanto não há quebra de overflow. 
* @param {HTMLElement} container Espaço onde será adicionado elementos HTML.
* @param {HTMLElement[]} blocks Elementos que serão adicionados e colocados à teste.
* @returns {number} O quantos de elementos que podem ser adicionados antes de dar overflow.
*/
function countPowerBlocksWithStrictOverflow(container, blocks) {
    let count = 0;
    let totalHeight = 0;
    const containerHeight = container.getBoundingClientRect().height;
    
    for (let i = 0; i < blocks.length; i++) {
        // Adicionar temporariamente o bloco ao container para medir a altura
        container.appendChild(blocks[i]);
        
        // Calcular a altura do próximo bloco
        const blockHeight = blocks[i].getBoundingClientRect().height;
        
        // Somar a altura acumulada
        totalHeight += blockHeight;
        
        // Verificar se a altura total ultrapassa a altura do contêiner
        if (totalHeight > containerHeight) {
            // console.log(`O overflow ocorreu ao tentar adicionar o bloco número ${i + 1}`);
            // Remover o bloco se causou overflow
            container.removeChild(blocks[i]);
            break;
        }
        
        // Incrementar o contador se o bloco foi adicionado com sucesso
        count++;
    }
    
    return count;
}

/**
 * Informa, em porcentagem, quanto tem espaço livre em um determinado elemento HTML.
 * @param {HTMLElement} container Elemento HTML com conteúdo.
 * @returns {number}
*/
function calculateRemainingSpacePercentage(container) {
    const containerHeight = container.getBoundingClientRect().height;
    let usedHeight = 0;
    
    // Calcular a altura total ocupada pelos filhos do contêiner
    Array.from(container.children).forEach(child => {
        usedHeight += child.getBoundingClientRect().height;
    });
    
    // Calcular a porcentagem de espaço restante
    const remainingSpace = containerHeight - usedHeight;
    return Math.floor((remainingSpace / containerHeight) * 100);
}

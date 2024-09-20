addSolveButton();
setUpOnReviewChange();

document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        onSolveButtonPressed();
    }
});

function setUpOnReviewChange() {
    const targetElement = document.querySelector('.character-header__content');
    const config = {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
    };

    const observer = new MutationObserver(() => {
        removeExistingAnswers();
    });
    observer.observe(targetElement, config);
}

function addSolveButton() {
    const elements = document.getElementsByClassName('quiz-input__question-type-container');
    if (elements.length === 0) {
        return;
    }

    elements.item(0).appendChild(Button('>> Solve', onSolveButtonPressed))
}

function Button(title, onClick) {
    const result = document.createElement('a');
    result.className = 'solve-button';
    result.textContent = 'solve';
    result.title = 'Ctrl+S';
    result.href = 'javascript:;';
    result.onclick = onClick;

    return result;
}

function onSolveButtonPressed() {
    chrome.storage.local.get(['apiToken'], function (result) {
        if ('apiToken' in result) {
            const apiToken = result['apiToken'];
            solveCurrentQuestion(apiToken);
        } else {
            alert('No API Token stored. Please open the extension settings and store your token there.');
        }
    });
}


function solveCurrentQuestion(apiToken) {
    const elements = document.getElementsByClassName('quiz-input__question-type-container');
    if (elements.length === 0) {
        return;
    }

    const subjectId = elements.item(0).getAttribute('data-subject-id');
    const questionType = elements.item(0).getAttribute('data-question-type');

    fetch('https://api.wanikani.com/v2/subjects/' + subjectId, {
        method: 'GET', headers: {
            'Authorization': `Bearer ${apiToken}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            solveSubject(data, questionType);
        })
        .catch(error => {
            console.error('There was a problem with the request:', error);
        });
}


function solveSubject(subject, questionType) {
    if (questionType.toLowerCase() === 'reading') {
        insertAnswer(getReading(subject));

        if (subject['object'] === 'kanji') {
            listAllKanjiReadings(subject);
        }
    }

    if (questionType.toLowerCase() === 'meaning') {
        insertAnswer(getMeaning(subject));
        listAllMeanings(subject);
    }
}

function insertAnswer(answer) {
    const elements = document.getElementsByClassName('quiz-input__input');
    if (elements.length === 0) {
        return;
    }

    elements.item(0).value = answer;
}

function listAllKanjiReadings(subject) {
    removeExistingAnswers();
    const result = AnswersContainer();
    const onyomiContainer = MeaningContainer();
    const kunyomiContainer = MeaningContainer();
    const nanoriContainer = MeaningContainer();

    for (let reading of subject['data']['readings']) {
        // accepted_answer
        if (reading['type'] === 'onyomi') {
            onyomiContainer.appendChild(Answer(reading['reading'], onyomiContainer.children.length > 0))
        }

        if (reading['type'] === 'kunyomi') {
            kunyomiContainer.appendChild(Answer(reading['reading'], kunyomiContainer.children.length > 0))
        }

        if (reading['type'] === 'nanori') {
            nanoriContainer.appendChild(Answer(reading['reading'], nanoriContainer.children.length > 0))
        }
    }

    fillAnswerContainerIfEmpty(onyomiContainer);
    fillAnswerContainerIfEmpty(kunyomiContainer);
    fillAnswerContainerIfEmpty(nanoriContainer);

    result.append(
        AnswerSection('On’yomi'),
        onyomiContainer,
        AnswerSection('Kun’yomi'),
        kunyomiContainer,
        AnswerSection('Nanori'),
        nanoriContainer
    )
    document.getElementById('additional-content').appendChild(result);
}

function listAllMeanings(subject) {
    removeExistingAnswers();
    const result = AnswersContainer();
    const primaryContainer = MeaningContainer();
    const alternativesContainer = MeaningContainer();

    for (let meaning of subject['data']['meanings']) {
        // accepted_answer
        if (meaning['primary']) {
            primaryContainer.appendChild(Answer(meaning['meaning'], primaryContainer.children.length > 0))
        } else {
            alternativesContainer.appendChild(Answer(meaning['meaning'], alternativesContainer.children.length > 0))
        }
    }

    fillAnswerContainerIfEmpty(primaryContainer);
    fillAnswerContainerIfEmpty(alternativesContainer);

    result.append(
        AnswerSection('Primary'),
        primaryContainer,
        AnswerSection('Alternatives'),
        alternativesContainer
    )
    document.getElementById('additional-content').appendChild(result);
}

function fillAnswerContainerIfEmpty(container) {
    if (container.children.length === 0) {
        container.appendChild(Span('-', 'empty-answer-container'))
    }
}

function removeExistingAnswers() {
    console.log('removeExistingAnswers()')
    const element = document.getElementById('all-answers-container');
    if (element) {
        console.log('>>remove');
        element.remove();
    }
}

function AnswersContainer() {
    const title = document.createElement('h3');
    title.textContent = 'All Answers';

    const result = document.createElement('div')
    result.id = 'all-answers-container';
    result.appendChild(title);

    return result;
}

function AnswerSection(title) {
    const result = document.createElement('h4')
    result.className = 'answer-section';
    result.textContent = title;

    return result;
}

function MeaningContainer() {
    const result = document.createElement('div')
    result.className = 'meaning-container';

    return result;
}

function Answer(text, delimiter) {
    const wrapper = Span();
    if (delimiter) {
        wrapper.appendChild(Span(', '))
    }
    wrapper.appendChild(Span(text, 'answer'))
    return wrapper;
}

function Span(text, classname) {
    const result = document.createElement('span');
    result.textContent = text;
    if (classname) {
        result.className = classname;
    }
    return result;
}

function getReading(subject) {
    for (let reading of subject['data']['readings']) {
        if (reading['accepted_answer']) {
            return reading['reading'];
        }
    }
}

function getMeaning(subject) {
    for (let meaning of subject['data']['meanings']) {
        if (meaning['accepted_answer']) {
            return meaning['meaning'];
        }
    }
}

function submitAnswer() {
    document.getElementsByClassName('quiz-input__submit-button')[0].click()
}

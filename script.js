const addJobButton = document.querySelector("#addJobBtn");
const jobDialog = document.querySelector("#jobDialog");
const jobForm = document.querySelector("#jobForm");
const jobList = document.querySelector("#jobList");
const kanbanBoard = document.querySelector("#kanbanBoard");
const dateInput = document.querySelector("#dateInput");
const reminderDateInput = document.querySelector("#reminderDateInput");
const storageMessage = document.querySelector("#storageMessage");
const dialogTitle = document.querySelector("#jobDialogTitle");
const saveJobButton = document.querySelector("#saveJobBtn");
const themeToggleButton = document.querySelector("#themeToggleBtn");

const storageKey = "jobtrack-applications";
const prepStorageKey = "jobtrack-interview-prep";
const themeStorageKey = "jobtrack-theme";
const validStatuses = ["Applied", "Assessment", "Interview", "Selected", "Rejected"];
const prepQuestions = [
    { id: "js-closures", category: "JavaScript", question: "What is a closure, and when would you use one?" },
    { id: "js-async", category: "JavaScript", question: "Explain promises and async/await." },
    { id: "js-dom", category: "JavaScript", question: "How do you select and update an element in the DOM?" },
    { id: "html-semantic", category: "HTML & CSS", question: "What are semantic HTML elements, and why are they useful?" },
    { id: "css-box-model", category: "HTML & CSS", question: "Explain the CSS box model." },
    { id: "css-responsive", category: "HTML & CSS", question: "How would you make a page responsive for mobile?" },
    { id: "dsa-array", category: "Problem solving", question: "How would you find the largest number in an array?" },
    { id: "dsa-complexity", category: "Problem solving", question: "What does time complexity describe?" },
    { id: "dsa-debug", category: "Problem solving", question: "How do you approach debugging an unfamiliar issue?" },
    { id: "hr-intro", category: "HR", question: "Tell me about yourself." },
    { id: "hr-project", category: "HR", question: "Describe a project challenge and how you solved it." },
    { id: "hr-motivation", category: "HR", question: "Why are you interested in this role?" },
];
const supportedSkills = [
    { name: "HTML", terms: ["html", "html5"] },
    { name: "CSS", terms: ["css", "css3"] },
    { name: "JavaScript", terms: ["javascript", "js", "ecmascript"] },
    { name: "TypeScript", terms: ["typescript"] },
    { name: "React", terms: ["react", "react.js"] },
    { name: "Vue", terms: ["vue", "vue.js"] },
    { name: "Angular", terms: ["angular"] },
    { name: "Node.js", terms: ["node.js", "nodejs"] },
    { name: "Express", terms: ["express", "express.js"] },
    { name: "REST APIs", terms: ["rest api", "restful api"] },
    { name: "Git", terms: ["git"] },
    { name: "SQL", terms: ["sql", "mysql", "postgresql", "postgres"] },
    { name: "MongoDB", terms: ["mongodb"] },
    { name: "Python", terms: ["python"] },
    { name: "Java", terms: ["java"] },
    { name: "C++", terms: ["c++"] },
    { name: "Testing", terms: ["testing", "jest", "vitest"] },
    { name: "Accessibility", terms: ["accessibility", "wcag"] },
    { name: "Docker", terms: ["docker"] },
    { name: "AWS", terms: ["aws", "amazon web services"] },
];
let jobs = [];
let storageAvailable = true;
let preparedQuestions = [];
let prepStorageAvailable = true;
let editingIndex = null;

function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    themeToggleButton.textContent = isDark ? "Light mode" : "Dark mode";
    themeToggleButton.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
    themeToggleButton.setAttribute("aria-pressed", String(isDark));
}

function loadTheme() {
    try {
        applyTheme(localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light");
    } catch (error) {
        showStorageMessage("Theme preference could not be loaded or saved in this browser.");
        console.error("Could not load JobTrack theme preference.", error);
    }
}

function saveTheme(theme) {
    try {
        localStorage.setItem(themeStorageKey, theme);
    } catch (error) {
        showStorageMessage("Your theme changed, but the preference could not be saved in this browser.");
        console.error("Could not save JobTrack theme preference.", error);
    }
}

function showStorageMessage(message) {
    storageMessage.textContent = message;
    storageMessage.hidden = false;
}

function loadJobs() {
    let savedJobs;

    try {
        savedJobs = localStorage.getItem(storageKey);
    } catch (error) {
        storageAvailable = false;
        showStorageMessage("Your browser blocked local storage. Applications will only be kept until you close or refresh this page.");
        console.error("Could not read JobTrack applications from local storage.", error);
        return;
    }

    if (savedJobs === null) {
        return;
    }

    try {
        const parsedJobs = JSON.parse(savedJobs);
        const isValid = Array.isArray(parsedJobs) && parsedJobs.every((job) =>
            job &&
            typeof job.company === "string" &&
            typeof job.role === "string" &&
            typeof job.date === "string" &&
            validStatuses.includes(job.status) &&
            (job.reminderDate === undefined || job.reminderDate === "" || isValidDate(job.reminderDate)) &&
            (job.reminderType === undefined || ["Follow-up", "Interview"].includes(job.reminderType))
        );

        if (!isValid) {
            throw new Error("Saved applications have an unexpected format.");
        }

        jobs = parsedJobs;
    } catch (error) {
        storageAvailable = false;
        showStorageMessage("Saved applications could not be read, so they were left unchanged. New applications will only be kept until you close or refresh this page.");
        console.error("Could not parse saved JobTrack applications.", error);
    }
}

function saveJobs() {
    if (!storageAvailable) {
        return;
    }

    try {
        localStorage.setItem(storageKey, JSON.stringify(jobs));
    } catch (error) {
        storageAvailable = false;
        showStorageMessage("Your latest change is visible, but could not be saved in this browser. It may be lost when you refresh.");
        console.error("Could not save JobTrack applications to local storage.", error);
    }
}

function getToday() {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60 * 1000);
    return localDate.toISOString().slice(0, 10);
}

function isValidDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;
}

function renderReminders() {
    const reminderList = document.querySelector("#reminderList");
    const reminders = jobs
        .map((job, index) => ({ job, index }))
        .filter(({ job }) => isValidDate(job.reminderDate))
        .sort((first, second) =>
            first.job.reminderDate.localeCompare(second.job.reminderDate) ||
            first.job.company.localeCompare(second.job.company)
        );
    const today = getToday();

    reminderList.replaceChildren();

    if (reminders.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "reminder-empty";
        emptyMessage.textContent = "No reminders yet. Add an interview or follow-up date to an application.";
        reminderList.append(emptyMessage);
        return;
    }

    reminders.forEach(({ job, index }) => {
        const item = document.createElement("article");
        const details = document.createElement("div");
        const company = document.createElement("h3");
        const role = document.createElement("p");
        const meta = document.createElement("div");
        const type = document.createElement("span");
        const date = document.createElement("time");
        const reminderType = ["Follow-up", "Interview"].includes(job.reminderType)
            ? job.reminderType
            : "Follow-up";
        const isOverdue = job.reminderDate < today;

        item.className = `reminder-item${isOverdue ? " is-overdue" : ""}`;
        item.dataset.jobIndex = index;
        company.className = "reminder-company";
        company.textContent = job.company;
        role.className = "reminder-role";
        role.textContent = job.role;
        details.append(company, role);
        meta.className = "reminder-meta";
        type.className = "reminder-type";
        type.textContent = isOverdue ? `Overdue ${reminderType.toLowerCase()}` : reminderType;
        date.className = "reminder-date";
        date.dateTime = job.reminderDate;
        date.textContent = new Date(`${job.reminderDate}T00:00:00`).toLocaleDateString();
        meta.append(type, date);
        item.append(details, meta);
        reminderList.append(item);
    });
}

function updateStatistics() {
    document.querySelector("#totalJobs").textContent = jobs.length;
    document.querySelector("#shortlisted").textContent = jobs.filter((job) =>
        ["Assessment", "Interview", "Selected"].includes(job.status)
    ).length;
    document.querySelector("#interviews").textContent = jobs.filter(
        (job) => job.status === "Interview"
    ).length;
    document.querySelector("#rejected").textContent = jobs.filter(
        (job) => job.status === "Rejected"
    ).length;
}

function renderAnalytics() {
    const statusChart = document.querySelector("#statusChart");
    const monthlyChart = document.querySelector("#monthlyChart");
    const maxStatusCount = Math.max(1, ...validStatuses.map(
        (status) => jobs.filter((job) => job.status === status).length
    ));

    statusChart.replaceChildren();
    validStatuses.forEach((status) => {
        const count = jobs.filter((job) => job.status === status).length;
        const row = document.createElement("li");
        const label = document.createElement("span");
        const track = document.createElement("span");
        const bar = document.createElement("span");
        const countLabel = document.createElement("span");

        row.className = "chart-row";
        label.textContent = status;
        track.className = "chart-track";
        track.setAttribute("aria-hidden", "true");
        bar.className = "chart-bar";
        bar.style.width = `${(count / maxStatusCount) * 100}%`;
        track.append(bar);
        countLabel.className = "chart-count";
        countLabel.textContent = count;
        row.append(label, track, countLabel);
        statusChart.append(row);
    });

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const count = jobs.filter((job) => {
            const appliedDate = new Date(`${job.date}T00:00:00`);
            return Number.isFinite(appliedDate.getTime()) &&
                `${appliedDate.getFullYear()}-${appliedDate.getMonth()}` === key;
        }).length;

        return {
            label: date.toLocaleDateString(undefined, { month: "short" }),
            count,
        };
    });
    const maxMonthCount = Math.max(1, ...months.map((month) => month.count));

    monthlyChart.replaceChildren();
    months.forEach((month) => {
        const column = document.createElement("div");
        const countLabel = document.createElement("span");
        const track = document.createElement("span");
        const bar = document.createElement("span");
        const monthLabel = document.createElement("span");

        column.className = "month-column";
        countLabel.className = "month-count";
        countLabel.textContent = month.count;
        track.className = "month-bar-track";
        track.setAttribute("aria-hidden", "true");
        bar.className = "month-bar";
        bar.style.height = `${month.count === 0 ? 0 : Math.max(8, (month.count / maxMonthCount) * 100)}%`;
        track.append(bar);
        monthLabel.className = "month-label";
        monthLabel.textContent = month.label;
        column.setAttribute("aria-label", `${month.label}: ${month.count} applications`);
        column.append(countLabel, track, monthLabel);
        monthlyChart.append(column);
    });
}

function renderKanbanBoard() {
    kanbanBoard.replaceChildren();

    validStatuses.forEach((status) => {
        const column = document.createElement("section");
        const heading = document.createElement("h3");
        const count = document.createElement("span");
        const cards = document.createElement("div");
        const columnJobs = jobs
            .map((job, index) => ({ job, index }))
            .filter(({ job }) => job.status === status);

        column.className = "kanban-column";
        heading.className = "kanban-column-heading";
        heading.textContent = status;
        count.className = "column-count";
        count.textContent = columnJobs.length;
        heading.append(count);
        cards.className = "kanban-cards";

        if (columnJobs.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "kanban-empty";
            emptyMessage.textContent = "No applications";
            cards.append(emptyMessage);
        }

        columnJobs.forEach(({ job, index }) => {
            const card = document.createElement("article");
            const company = document.createElement("h4");
            const role = document.createElement("p");
            const date = document.createElement("p");
            const statusLabel = document.createElement("label");
            const statusSelect = document.createElement("select");

            card.className = "kanban-card";
            company.textContent = job.company;
            role.className = "kanban-role";
            role.textContent = job.role;
            date.className = "kanban-date";
            date.textContent = `Applied ${new Date(`${job.date}T00:00:00`).toLocaleDateString()}`;
            statusLabel.className = "kanban-status-label";
            statusLabel.textContent = "Update stage";
            statusSelect.className = "kanban-status-select";
            statusSelect.dataset.index = index;
            statusSelect.setAttribute("aria-label", `Update ${job.company} application stage`);

            validStatuses.forEach((optionStatus) => {
                const option = document.createElement("option");
                option.value = optionStatus;
                option.textContent = optionStatus;
                option.selected = optionStatus === job.status;
                statusSelect.append(option);
            });

            statusLabel.append(statusSelect);
            card.append(company, role, date, statusLabel);
            cards.append(card);
        });

        column.append(heading, cards);
        kanbanBoard.append(column);
    });
}

function renderJobs() {
    jobList.replaceChildren();
    const searchTerm = document.querySelector("#applicationSearch").value.trim().toLocaleLowerCase();
    const selectedStatus = document.querySelector("#statusFilter").value;
    const sortOrder = document.querySelector("#sortApplications").value;
    const visibleJobs = jobs
        .map((job, index) => ({ job, index }))
        .filter(({ job }) => {
            const matchesSearch = `${job.company} ${job.role}`.toLocaleLowerCase().includes(searchTerm);
            return matchesSearch && (!selectedStatus || job.status === selectedStatus);
        });

    if (sortOrder === "company") {
        visibleJobs.sort((first, second) =>
            first.job.company.localeCompare(second.job.company) || first.index - second.index
        );
    } else {
        visibleJobs.sort((first, second) => {
            const dateOrder = first.job.date.localeCompare(second.job.date);
            const direction = sortOrder === "oldest" ? 1 : -1;
            return dateOrder * direction || first.index - second.index;
        });
    }

    document.querySelector("#applicationResultCount").textContent =
        `${visibleJobs.length} of ${jobs.length} ${jobs.length === 1 ? "application" : "applications"}`;

    if (jobs.length === 0) {
        const emptyRow = document.createElement("tr");
        const emptyCell = document.createElement("td");
        emptyCell.colSpan = 5;
        emptyCell.textContent = "No applications yet.";
        emptyRow.append(emptyCell);
        jobList.append(emptyRow);
    } else if (visibleJobs.length === 0) {
        const emptyRow = document.createElement("tr");
        const emptyCell = document.createElement("td");
        emptyCell.colSpan = 5;
        emptyCell.textContent = "No applications match these filters.";
        emptyRow.append(emptyCell);
        jobList.append(emptyRow);
    }

    visibleJobs.forEach(({ job, index }) => {
        const row = document.createElement("tr");
        const companyCell = document.createElement("td");
        const roleCell = document.createElement("td");
        const dateCell = document.createElement("td");
        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");
        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");
        const editButton = document.createElement("button");
        const deleteButton = document.createElement("button");

        companyCell.textContent = job.company;
        roleCell.textContent = job.role;
        dateCell.textContent = new Date(`${job.date}T00:00:00`).toLocaleDateString();
        statusBadge.className = `status-badge status-${job.status.toLowerCase()}`;
        statusBadge.textContent = job.status;
        statusCell.append(statusBadge);
        actions.className = "job-actions";
        editButton.type = "button";
        editButton.dataset.action = "edit";
        editButton.dataset.index = index;
        editButton.textContent = "Edit";
        editButton.setAttribute("aria-label", `Edit ${job.company} application`);
        deleteButton.type = "button";
        deleteButton.className = "delete-job";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.index = index;
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", `Delete ${job.company} application`);
        actions.append(editButton, deleteButton);
        actionsCell.append(actions);
        row.append(companyCell, roleCell, dateCell, statusCell, actionsCell);
        jobList.append(row);
    });

    renderReminders();
    renderKanbanBoard();
    updateStatistics();
    renderAnalytics();
    saveJobs();
}

function loadPreparedQuestions() {
    try {
        const savedQuestions = localStorage.getItem(prepStorageKey);

        if (savedQuestions === null) {
            return;
        }

        const parsedQuestions = JSON.parse(savedQuestions);
        const questionIds = prepQuestions.map((item) => item.id);
        const isValid = Array.isArray(parsedQuestions) && parsedQuestions.every((id) =>
            typeof id === "string" && questionIds.includes(id)
        );

        if (!isValid) {
            throw new Error("Saved interview preparation data has an unexpected format.");
        }

        preparedQuestions = [...new Set(parsedQuestions)];
    } catch (error) {
        prepStorageAvailable = false;
        showStorageMessage("Interview preparation progress could not be loaded or saved in this browser.");
        console.error("Could not load interview preparation progress.", error);
    }
}

function savePreparedQuestions() {
    if (!prepStorageAvailable) {
        return;
    }

    try {
        localStorage.setItem(prepStorageKey, JSON.stringify(preparedQuestions));
    } catch (error) {
        prepStorageAvailable = false;
        showStorageMessage("Interview preparation progress could not be saved in this browser.");
        console.error("Could not save interview preparation progress.", error);
    }
}

function renderPrepQuestions() {
    const prepQuestionsContainer = document.querySelector("#prepQuestions");
    const progressText = document.querySelector("#prepProgress");
    const progressBar = document.querySelector("#prepProgressBar");
    const categories = [...new Set(prepQuestions.map((item) => item.category))];

    prepQuestionsContainer.replaceChildren();

    categories.forEach((category) => {
        const group = document.createElement("section");
        const heading = document.createElement("h3");
        const list = document.createElement("div");

        group.className = "prep-category";
        heading.textContent = category;
        list.className = "prep-category-questions";

        prepQuestions
            .filter((item) => item.category === category)
            .forEach((item) => {
                const label = document.createElement("label");
                const checkbox = document.createElement("input");
                const question = document.createElement("span");

                label.className = "prep-question";
                checkbox.type = "checkbox";
                checkbox.value = item.id;
                checkbox.checked = preparedQuestions.includes(item.id);
                label.classList.toggle("is-prepared", checkbox.checked);
                checkbox.setAttribute("aria-label", `Mark as prepared: ${item.question}`);
                question.textContent = item.question;
                label.append(checkbox, question);
                list.append(label);
            });

        group.append(heading, list);
        prepQuestionsContainer.append(group);
    });

    progressText.textContent = `${preparedQuestions.length} of ${prepQuestions.length} prepared`;
    progressBar.max = prepQuestions.length;
    progressBar.value = preparedQuestions.length;
    document.querySelector("#prepAnalyticsPercent").textContent =
        `${Math.round((preparedQuestions.length / prepQuestions.length) * 100)}%`;
    document.querySelector("#prepAnalyticsCaption").textContent =
        `${preparedQuestions.length} of ${prepQuestions.length} questions prepared`;
    const analyticsBar = document.querySelector("#prepAnalyticsBar");
    analyticsBar.max = prepQuestions.length;
    analyticsBar.value = preparedQuestions.length;
}

function textContainsTerm(text, term) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const expression = new RegExp(`(^|[^a-z0-9])${escapedTerm}([^a-z0-9]|$)`, "i");
    return expression.test(text);
}

function renderSkillList(list, skills, isMissing) {
    list.replaceChildren();

    if (skills.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "skill-empty";
        emptyItem.textContent = isMissing ? "No skill gaps found in this list." : "No matching skills found.";
        list.append(emptyItem);
        return;
    }

    skills.forEach((skill) => {
        const item = document.createElement("li");
        item.className = `skill-chip${isMissing ? " is-missing" : ""}`;
        item.textContent = skill.name;
        list.append(item);
    });
}

document.querySelector("#skillAnalyzerForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const description = document.querySelector("#jobDescriptionInput").value.trim();
    const mySkills = document.querySelector("#mySkillsInput").value.trim();
    const supportedInDescription = supportedSkills.filter((skill) =>
        skill.terms.some((term) => textContainsTerm(description, term))
    );
    const matchedSkills = supportedInDescription.filter((skill) =>
        skill.terms.some((term) => textContainsTerm(mySkills, term))
    );
    const missingSkills = supportedInDescription.filter(
        (skill) => !matchedSkills.includes(skill)
    );
    const result = document.querySelector("#skillResults");
    const matchSummary = document.querySelector("#skillMatchSummary");
    const analysisNote = document.querySelector("#skillAnalysisNote");

    result.hidden = false;
    if (supportedInDescription.length === 0) {
        matchSummary.textContent = "No supported skills were found in this job description.";
        analysisNote.textContent = `This simple analyzer checks ${supportedSkills.length} common technology skills. Try including terms such as JavaScript, React, SQL, or Git.`;
    } else {
        const matchPercent = Math.round((matchedSkills.length / supportedInDescription.length) * 100);
        matchSummary.textContent = `You match ${matchedSkills.length} of ${supportedInDescription.length} detected skills (${matchPercent}%).`;
        analysisNote.textContent = "This is a keyword comparison, not an assessment of your skill level. Check the full job description and tailor your resume honestly.";
    }

    renderSkillList(document.querySelector("#matchedSkills"), matchedSkills, false);
    renderSkillList(document.querySelector("#missingSkills"), missingSkills, true);
});

addJobButton.addEventListener("click", () => {
    editingIndex = null;
    jobForm.reset();
    dialogTitle.textContent = "Add an application";
    saveJobButton.textContent = "Save application";
    dateInput.value = getToday();
    jobDialog.showModal();
});

jobList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const index = Number(button.dataset.index);

    if (!Number.isInteger(index) || index < 0 || index >= jobs.length) {
        return;
    }

    if (button.dataset.action === "edit") {
        const job = jobs[index];
        editingIndex = index;
        jobForm.elements.company.value = job.company;
        jobForm.elements.role.value = job.role;
        jobForm.elements.date.value = job.date;
        jobForm.elements.status.value = job.status;
        jobForm.elements.reminderDate.value = job.reminderDate || "";
        jobForm.elements.reminderType.value = ["Follow-up", "Interview"].includes(job.reminderType)
            ? job.reminderType
            : "Follow-up";
        dialogTitle.textContent = "Edit application";
        saveJobButton.textContent = "Save changes";
        jobDialog.showModal();
    } else if (button.dataset.action === "delete") {
        const job = jobs[index];

        if (window.confirm(`Delete the application for ${job.company}?`)) {
            jobs.splice(index, 1);
            renderJobs();
        }
    }
});

kanbanBoard.addEventListener("change", (event) => {
    const select = event.target.closest("select[data-index]");

    if (!select) {
        return;
    }

    const index = Number(select.dataset.index);

    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= jobs.length ||
        !validStatuses.includes(select.value)
    ) {
        return;
    }

    jobs[index].status = select.value;
    renderJobs();
});

document.querySelector("#prepQuestions").addEventListener("change", (event) => {
    const checkbox = event.target.closest('input[type="checkbox"]');

    if (!checkbox) {
        return;
    }

    if (checkbox.checked && !preparedQuestions.includes(checkbox.value)) {
        preparedQuestions.push(checkbox.value);
    } else if (!checkbox.checked) {
        preparedQuestions = preparedQuestions.filter((id) => id !== checkbox.value);
    }

    savePreparedQuestions();
    renderPrepQuestions();
});

document.querySelector("#applicationSearch").addEventListener("input", renderJobs);
document.querySelector("#statusFilter").addEventListener("change", renderJobs);
document.querySelector("#sortApplications").addEventListener("change", renderJobs);

themeToggleButton.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    saveTheme(nextTheme);
});

document.querySelector("#closeJobDialog").addEventListener("click", () => {
    jobDialog.close();
});

document.querySelector("#cancelJobBtn").addEventListener("click", () => {
    jobDialog.close();
});

jobDialog.addEventListener("close", () => {
    editingIndex = null;
    jobForm.reset();
});

jobForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(jobForm);
    const application = {
        company: formData.get("company").trim(),
        role: formData.get("role").trim(),
        date: formData.get("date"),
        status: formData.get("status"),
        reminderDate: formData.get("reminderDate"),
        reminderType: formData.get("reminderType"),
    };

    if (editingIndex === null) {
        jobs.push(application);
    } else {
        jobs[editingIndex] = application;
    }

    renderJobs();
    jobForm.reset();
    jobDialog.close();
});

loadTheme();
loadJobs();
renderJobs();
loadPreparedQuestions();
renderPrepQuestions();
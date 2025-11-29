const STORAGE_KEYS = {
    PROJECTS: 'bb_projects',
    LOGS: 'bb_logs',
    MATERIALS: 'bb_materials',
    EXPENSES: 'bb_expenses',
    PAYMENTS: 'bb_payments',
    TASKS: 'bb_tasks',
};

// Seed data
const SEED_PROJECTS = [
    {
        id: '1',
        name: 'Krishna House',
        client: 'Mr. Sharma',
        address: 'Plot 45, Green Avenue',
        startDate: '2025-11-01',
        status: 'In Progress',
        budget: 500000,
        spent: 180000,
        progress: 35,
    },
    {
        id: '2',
        name: 'City Center Renovation',
        client: 'City Corp',
        address: 'Sector 12, Main Market',
        startDate: '2025-10-15',
        status: 'On Hold',
        budget: 1200000,
        spent: 450000,
        progress: 40,
    },
    {
        id: '3',
        name: 'Villa 22',
        client: 'Mrs. Verma',
        address: 'Lake View Road',
        startDate: '2025-12-01',
        status: 'Planned',
        budget: 850000,
        spent: 0,
        progress: 0,
    },
];

export const storage = {
    getProjects: () => {
        const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        if (!data) {
            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
            return SEED_PROJECTS;
        }
        return JSON.parse(data);
    },

    addProject: (project) => {
        const projects = storage.getProjects();
        const newProject = { ...project, id: Date.now().toString(), spent: 0, progress: 0 };
        projects.push(newProject);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
        return newProject;
    },

    updateProject: (id, updates) => {
        const projects = storage.getProjects();
        const index = projects.findIndex(p => p.id === id);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updates };
            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
            return projects[index];
        }
        return null;
    },

    getProject: (id) => {
        const projects = storage.getProjects();
        return projects.find(p => p.id === id);
    },

    deleteProject: (id) => {
        const projects = storage.getProjects();
        const filteredProjects = projects.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filteredProjects));

        // Cascade delete expenses
        const expenses = storage.getExpenses();
        const filteredExpenses = expenses.filter(e => e.projectId !== id);
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filteredExpenses));

        // Cascade delete payments
        const payments = storage.getPayments();
        const filteredPayments = payments.filter(p => p.projectId !== id);
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(filteredPayments));

        // Cascade delete logs
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
        const filteredLogs = logs.filter(l => l.projectId !== id);
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(filteredLogs));

        return true;
    },

    // Phase Management
    addPhase: (projectId, phase) => {
        const projects = storage.getProjects();
        const index = projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            const newPhase = {
                ...phase,
                id: `ph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                spent: 0,
                progress: 0,
                status: 'Pending'
            };
            if (!projects[index].phases) projects[index].phases = [];
            projects[index].phases.push(newPhase);

            // Recalculate Project Progress
            const totalProgress = projects[index].phases.reduce((sum, p) => {
                if (p.status === 'Completed') return sum + 100;
                if (p.status === 'In Progress') return sum + 50;
                return sum;
            }, 0);
            projects[index].progress = Math.round(totalProgress / projects[index].phases.length);

            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
            return newPhase;
        }
        return null;
    },

    updatePhase: (projectId, phaseId, updates) => {
        const projects = storage.getProjects();
        const projIndex = projects.findIndex(p => p.id === projectId);
        if (projIndex !== -1 && projects[projIndex].phases) {
            const phaseIndex = projects[projIndex].phases.findIndex(ph => ph.id === phaseId);
            if (phaseIndex !== -1) {
                projects[projIndex].phases[phaseIndex] = { ...projects[projIndex].phases[phaseIndex], ...updates };

                // Recalculate Project Progress
                const totalProgress = projects[projIndex].phases.reduce((sum, p) => {
                    if (p.status === 'Completed') return sum + 100;
                    if (p.status === 'In Progress') return sum + 50;
                    return sum;
                }, 0);
                projects[projIndex].progress = Math.round(totalProgress / projects[projIndex].phases.length);

                localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
                return projects[projIndex].phases[phaseIndex];
            }
        }
        return null;
    },

    deletePhase: (projectId, phaseId) => {
        const projects = storage.getProjects();
        const projIndex = projects.findIndex(p => p.id === projectId);
        if (projIndex !== -1 && projects[projIndex].phases) {
            projects[projIndex].phases = projects[projIndex].phases.filter(ph => ph.id !== phaseId);

            // Recalculate Project Progress
            if (projects[projIndex].phases.length > 0) {
                const totalProgress = projects[projIndex].phases.reduce((sum, p) => {
                    if (p.status === 'Completed') return sum + 100;
                    if (p.status === 'In Progress') return sum + 50;
                    return sum;
                }, 0);
                projects[projIndex].progress = Math.round(totalProgress / projects[projIndex].phases.length);
            } else {
                projects[projIndex].progress = 0;
            }

            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
            return true;
        }
        return false;
    },

    getLogs: (projectId) => {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
        return logs.filter(l => l.projectId === projectId);
    },

    addLog: (log) => {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
        const newLog = { ...log, id: Date.now().toString(), date: new Date().toISOString() };
        logs.push(newLog);
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
        return newLog;
    },

    updateLog: (id, updatedLog) => {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
        const index = logs.findIndex(log => log.id === id);
        if (index !== -1) {
            logs[index] = { ...logs[index], ...updatedLog, id };
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
            return logs[index];
        }
        return null;
    },

    deleteLog: (id) => {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
        const updated = logs.filter(log => log.id !== id);
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
        return updated;
    },

    getLogs: (projectId) => {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
        return projectId ? logs.filter(log => log.projectId === projectId) : logs;
    },

    getMaterials: () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIALS) || '[]');
    },

    addMaterial: (material) => {
        const materials = storage.getMaterials();
        const newMaterial = {
            ...material,
            id: Date.now().toString(),
            stock: Number(material.stock) || 0
        };
        materials.push(newMaterial);
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
        return newMaterial;
    },

    updateStock: (materialId, quantity, type) => {
        const materials = storage.getMaterials();
        const index = materials.findIndex(m => m.id === materialId);
        if (index !== -1) {
            const currentStock = Number(materials[index].stock) || 0;
            const change = Number(quantity);
            materials[index].stock = type === 'IN' ? currentStock + change : currentStock - change;
            localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
            return materials[index];
        }
        return null;
    },

    getExpenses: () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
    },

    addExpense: (expense) => {
        const expenses = storage.getExpenses();
        const newExpense = { ...expense, id: Date.now().toString(), date: expense.date || new Date().toISOString().split('T')[0] };
        expenses.push(newExpense);
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

        // Update project spent amount
        if (expense.projectId) {
            const projects = storage.getProjects();
            const projectIndex = projects.findIndex(p => p.id === expense.projectId);
            if (projectIndex !== -1) {
                projects[projectIndex].spent = (projects[projectIndex].spent || 0) + Number(expense.amount);

                // Update Phase Spent
                if (expense.phaseId && projects[projectIndex].phases) {
                    const phaseIndex = projects[projectIndex].phases.findIndex(ph => ph.id === expense.phaseId);
                    if (phaseIndex !== -1) {
                        projects[projectIndex].phases[phaseIndex].spent = (projects[projectIndex].phases[phaseIndex].spent || 0) + Number(expense.amount);
                    }
                }

                localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
            }
        }

        return newExpense;
    },

    updateExpense: (id, updatedExpense) => {
        const expenses = storage.getExpenses();
        const index = expenses.findIndex(e => e.id === id);

        if (index !== -1) {
            const oldExpense = expenses[index];
            expenses[index] = { ...updatedExpense, id }; // Ensure ID doesn't change
            localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

            // Update project spent amounts
            const projects = storage.getProjects();
            let projectsUpdated = false;

            // Case 1: Project changed
            if (oldExpense.projectId !== updatedExpense.projectId) {
                // Deduct from old project
                if (oldExpense.projectId) {
                    const oldProjIndex = projects.findIndex(p => p.id === oldExpense.projectId);
                    if (oldProjIndex !== -1) {
                        projects[oldProjIndex].spent = (projects[oldProjIndex].spent || 0) - Number(oldExpense.amount);
                        projectsUpdated = true;
                    }
                }
                // Add to new project
                if (updatedExpense.projectId) {
                    const newProjIndex = projects.findIndex(p => p.id === updatedExpense.projectId);
                    if (newProjIndex !== -1) {
                        projects[newProjIndex].spent = (projects[newProjIndex].spent || 0) + Number(updatedExpense.amount);
                        projectsUpdated = true;
                    }
                }
            }
            // Case 2: Same project, amount changed
            else if (updatedExpense.projectId && Number(oldExpense.amount) !== Number(updatedExpense.amount)) {
                const projIndex = projects.findIndex(p => p.id === updatedExpense.projectId);
                if (projIndex !== -1) {
                    const diff = Number(updatedExpense.amount) - Number(oldExpense.amount);
                    projects[projIndex].spent = (projects[projIndex].spent || 0) + diff;
                    projectsUpdated = true;
                }
            }

            // Update Phase Spent Amount
            if (projectsUpdated || oldExpense.phaseId !== updatedExpense.phaseId) {
                const projIndex = projects.findIndex(p => p.id === (updatedExpense.projectId || oldExpense.projectId));
                if (projIndex !== -1 && projects[projIndex].phases) {
                    // Recalculate phase totals for accuracy
                    const projectExpenses = expenses.filter(e => e.projectId === projects[projIndex].id);

                    projects[projIndex].phases = projects[projIndex].phases.map(phase => {
                        const phaseSpent = projectExpenses
                            .filter(e => e.phaseId === phase.id)
                            .reduce((sum, e) => sum + Number(e.amount), 0);
                        return { ...phase, spent: phaseSpent };
                    });
                    projectsUpdated = true;
                }
            }

            if (projectsUpdated) {
                localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
            }

            if (projectsUpdated) {
                localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
            }

            return expenses[index];
        }
        return null;
    },

    deleteExpense: (id) => {
        const expenses = storage.getExpenses();
        const expenseToDelete = expenses.find(e => e.id === id);
        const filteredExpenses = expenses.filter(e => e.id !== id);
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filteredExpenses));

        // Update project spent amount
        if (expenseToDelete && expenseToDelete.projectId) {
            const projects = storage.getProjects();
            const projectIndex = projects.findIndex(p => p.id === expenseToDelete.projectId);
            if (projectIndex !== -1) {
                projects[projectIndex].spent = (projects[projectIndex].spent || 0) - Number(expenseToDelete.amount);
                localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
            }
        }

        return filteredExpenses;
    },

    getPayments: () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS) || '[]');
    },

    addPayment: (payment) => {
        const payments = storage.getPayments();
        const newPayment = { ...payment, id: Date.now().toString(), date: payment.date || new Date().toISOString().split('T')[0] };
        payments.push(newPayment);
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

        // Update project received amount
        if (payment.projectId) {
            const projects = storage.getProjects();
            const projectIndex = projects.findIndex(p => p.id === payment.projectId);
            if (projectIndex !== -1) {
                projects[projectIndex].received = (projects[projectIndex].received || 0) + Number(payment.amount);
                localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
            }
        }

        return newPayment;
    },

    updatePayment: (id, updatedPayment) => {
        const payments = storage.getPayments();
        const index = payments.findIndex(p => p.id === id);

        if (index !== -1) {
            const oldPayment = payments[index];
            payments[index] = { ...updatedPayment, id };
            localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

            // Update project received amount
            if (oldPayment.projectId) {
                const projects = storage.getProjects();
                const projectIndex = projects.findIndex(p => p.id === oldPayment.projectId);
                if (projectIndex !== -1) {
                    // Remove old amount and add new amount
                    projects[projectIndex].received = (projects[projectIndex].received || 0) - Number(oldPayment.amount) + Number(updatedPayment.amount);
                    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
                }
            }
            return payments[index];
        }
        return null;
    },

    deletePayment: (id) => {
        const payments = storage.getPayments();
        const paymentToDelete = payments.find(p => p.id === id);
        const filteredPayments = payments.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(filteredPayments));

        // Update project received amount
        if (paymentToDelete && paymentToDelete.projectId) {
            const projects = storage.getProjects();
            const projectIndex = projects.findIndex(p => p.id === paymentToDelete.projectId);
            if (projectIndex !== -1) {
                projects[projectIndex].received = (projects[projectIndex].received || 0) - Number(paymentToDelete.amount);
                localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
            }
        }

        return filteredPayments;
    },

    getProjectPayments: (projectId) => {
        const payments = storage.getPayments();
        return payments.filter(p => p.projectId === projectId);
    },

    // ===== PAYMENT MILESTONES =====
    getMilestones: () => {
        return JSON.parse(localStorage.getItem('bb_milestones') || '[]');
    },

    getProjectMilestones: (projectId) => {
        const milestones = storage.getMilestones();
        return milestones.filter(m => m.projectId === projectId).sort((a, b) => a.order - b.order);
    },

    addMilestone: (milestoneData) => {
        const milestones = storage.getMilestones();
        const projectMilestones = milestones.filter(m => m.projectId === milestoneData.projectId);

        const newMilestone = {
            ...milestoneData,
            id: Date.now().toString(),
            receivedAmount: 0,
            status: 'Pending',
            order: projectMilestones.length + 1,
            createdAt: new Date().toISOString()
        };

        milestones.push(newMilestone);
        localStorage.setItem('bb_milestones', JSON.stringify(milestones));
        return newMilestone;
    },

    updateMilestone: (milestoneId, updates) => {
        const milestones = storage.getMilestones();
        const index = milestones.findIndex(m => m.id === milestoneId);

        if (index !== -1) {
            milestones[index] = { ...milestones[index], ...updates };
            localStorage.setItem('bb_milestones', JSON.stringify(milestones));
            return milestones[index];
        }
        return null;
    },

    deleteMilestone: (milestoneId) => {
        const milestones = storage.getMilestones();
        const filtered = milestones.filter(m => m.id !== milestoneId);
        localStorage.setItem('bb_milestones', JSON.stringify(filtered));
        return filtered;
    },

    updateMilestoneStatus: (milestoneId) => {
        const milestone = storage.getMilestones().find(m => m.id === milestoneId);
        if (!milestone) return null;

        // Calculate received amount from linked payments
        const payments = storage.getPayments().filter(p => p.milestoneId === milestoneId);
        const receivedAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

        // Determine status
        let status = 'Pending';
        if (receivedAmount >= milestone.expectedAmount) {
            status = 'Completed';
        } else if (receivedAmount > 0) {
            status = 'Partial';
        }

        return storage.updateMilestone(milestoneId, { receivedAmount, status });
    },

    createMilestoneTemplate: (projectId, templateType, projectBudget) => {
        const project = storage.getProjects().find(p => p.id === projectId);
        if (!project) return [];

        const budget = projectBudget || project.budget;
        const milestones = [];
        const today = new Date();

        switch (templateType) {
            case '30-40-30':
                milestones.push(
                    {
                        projectId,
                        name: 'Advance Payment',
                        description: '30% advance payment',
                        expectedAmount: budget * 0.30,
                        percentage: 30,
                        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    },
                    {
                        projectId,
                        name: 'Mid-Progress Payment',
                        description: '40% payment at mid-progress',
                        expectedAmount: budget * 0.40,
                        percentage: 40,
                        dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    },
                    {
                        projectId,
                        name: 'Completion Payment',
                        description: '30% final payment on completion',
                        expectedAmount: budget * 0.30,
                        percentage: 30,
                        dueDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    }
                );
                break;

            case '25-25-25-25':
                for (let i = 1; i <= 4; i++) {
                    milestones.push({
                        projectId,
                        name: `Quarter ${i} Payment`,
                        description: `25% payment for quarter ${i}`,
                        expectedAmount: budget * 0.25,
                        percentage: 25,
                        dueDate: new Date(today.getTime() + (i * 15) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    });
                }
                break;

            case 'phase-based':
                const phases = project.phases || [];
                if (phases.length > 0) {
                    const amountPerPhase = budget / phases.length;
                    phases.forEach((phase, index) => {
                        milestones.push({
                            projectId,
                            phaseId: phase.id,
                            name: `${phase.name} Completion`,
                            description: `Payment for ${phase.name} phase completion`,
                            expectedAmount: amountPerPhase,
                            percentage: (100 / phases.length),
                            dueDate: new Date(today.getTime() + ((index + 1) * 20) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        });
                    });
                }
                break;
        }

        // Add all milestones
        const created = milestones.map(m => storage.addMilestone(m));
        return created;
    },

    getVendors: () => {
        return JSON.parse(localStorage.getItem('bb_vendors') || '[]');

    },

    addVendor: (vendor) => {
        const vendors = storage.getVendors();
        const newVendor = { ...vendor, id: Date.now().toString() };
        vendors.push(newVendor);
        localStorage.setItem('bb_vendors', JSON.stringify(vendors));
        return newVendor;
    },

    deleteVendor: (id) => {
        const vendors = storage.getVendors();
        const filteredVendors = vendors.filter(v => v.id !== id);
        localStorage.setItem('bb_vendors', JSON.stringify(filteredVendors));
        return filteredVendors;
    },

    getQuotes: () => {
        return JSON.parse(localStorage.getItem('bb_quotes') || '[]');
    },

    addQuote: (quote) => {
        const quotes = storage.getQuotes();
        const newQuote = { ...quote, id: Date.now().toString(), status: 'Draft', date: new Date().toISOString().split('T')[0] };
        quotes.push(newQuote);
        localStorage.setItem('bb_quotes', JSON.stringify(quotes));
        return newQuote;
    },

    deleteQuote: (id) => {
        const quotes = storage.getQuotes();
        const filteredQuotes = quotes.filter(q => q.id !== id);
        localStorage.setItem('bb_quotes', JSON.stringify(filteredQuotes));
        return filteredQuotes;
    },

    exportData: () => {
        const data = {
            projects: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]'),
            logs: JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]'),
            materials: JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIALS) || '[]'),
            expenses: JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]'),
            vendors: JSON.parse(localStorage.getItem('bb_vendors') || '[]'),
            quotes: JSON.parse(localStorage.getItem('bb_quotes') || '[]'),
            subcontractors: JSON.parse(localStorage.getItem('bb_subcontractors') || '[]'),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        return data;
    },

    importData: (jsonData) => {
        try {
            if (!jsonData || !jsonData.version) {
                throw new Error('Invalid backup file format');
            }

            // Restore data
            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(jsonData.projects || []));
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(jsonData.logs || []));
            localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(jsonData.materials || []));
            localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(jsonData.expenses || []));
            localStorage.setItem('bb_vendors', JSON.stringify(jsonData.vendors || []));
            localStorage.setItem('bb_quotes', JSON.stringify(jsonData.quotes || []));
            localStorage.setItem('bb_subcontractors', JSON.stringify(jsonData.subcontractors || []));

            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    },

    // Task Management
    getTasks: () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    },

    addTask: (task) => {
        const tasks = storage.getTasks();
        const newTask = {
            ...task,
            id: Date.now().toString(),
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
        return newTask;
    },

    updateTask: (id, updatedTask) => {
        const tasks = storage.getTasks();
        const index = tasks.findIndex(task => task.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updatedTask, id };
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
            return tasks[index];
        }
        return null;
    },

    deleteTask: (id) => {
        const tasks = storage.getTasks();
        const updated = tasks.filter(task => task.id !== id);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
        return updated;
    },

    toggleTaskComplete: (id) => {
        const tasks = storage.getTasks();
        const index = tasks.findIndex(task => task.id === id);
        if (index !== -1) {
            tasks[index].completed = !tasks[index].completed;
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
            return tasks[index];
        }
        return null;
    },

    // Materials & Tools Management
    getMaterials: () => {
        const materials = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIALS) || '[]');

        // Recalculate stock for tools from their locations
        return materials.map(item => {
            if (item.type === 'Tool' && item.locations && item.locations.length > 0) {
                const totalStock = item.locations.reduce((sum, loc) => sum + Number(loc.quantity || 0), 0);
                return { ...item, stock: totalStock };
            }
            return item;
        });
    },

    addMaterial: (item) => {
        const materials = storage.getMaterials();
        const newItem = {
            ...item,
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: item.type || 'Material',
            stock: Number(item.stock) || 0,
            reorderLevel: Number(item.reorderLevel) || 10,
            locations: item.type === 'Tool'
                ? [{ projectId: 'company', projectName: 'Company Warehouse', quantity: Number(item.stock) || 0 }]
                : []
        };
        materials.push(newItem);
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
        return newItem;
    },

    updateStock: (id, qty, type) => {
        const materials = storage.getMaterials();
        const index = materials.findIndex(m => m.id === id);
        if (index !== -1) {
            const item = materials[index];

            if (item.type === 'Material') {
                // Simple stock update for materials
                if (type === 'IN') {
                    item.stock += Number(qty);
                } else if (type === 'OUT') {
                    item.stock = Math.max(0, item.stock - Number(qty));
                }
            } else if (item.type === 'Tool') {
                // For tools, update company warehouse location
                const companyLoc = item.locations.find(loc => loc.projectId === 'company');
                if (companyLoc) {
                    if (type === 'IN') {
                        companyLoc.quantity += Number(qty);
                        item.stock += Number(qty);
                    } else if (type === 'OUT') {
                        const decrease = Math.min(companyLoc.quantity, Number(qty));
                        companyLoc.quantity -= decrease;
                        item.stock = Math.max(0, item.stock - decrease);
                    }
                }
            }

            materials[index] = item;
            localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
            return item;
        }
        return null;
    },

    transferTool: (itemId, fromProjectId, toProjectId, quantity) => {
        const materials = storage.getMaterials();
        const index = materials.findIndex(m => m.id === itemId);

        if (index !== -1 && materials[index].type === 'Tool') {
            const item = materials[index];
            const fromLoc = item.locations.find(loc => loc.projectId === fromProjectId);

            if (fromLoc && Number(fromLoc.quantity) >= quantity) {
                // Reduce from source
                fromLoc.quantity = Number(fromLoc.quantity) - quantity;

                // Add to destination
                let toLoc = item.locations.find(loc => loc.projectId === toProjectId);
                if (toLoc) {
                    toLoc.quantity = Number(toLoc.quantity) + quantity;
                } else {
                    // Get project name
                    const projects = storage.getProjects();
                    const project = projects.find(p => p.id === toProjectId);
                    const projectName = toProjectId === 'company' ? 'Company Warehouse' : (project ? project.name : 'Unknown');

                    item.locations.push({
                        projectId: toProjectId,
                        projectName: projectName,
                        quantity: quantity
                    });
                }

                // Clean up empty locations
                item.locations = item.locations.filter(loc => Number(loc.quantity) > 0);

                // Recalculate total stock to be safe
                item.stock = item.locations.reduce((sum, loc) => sum + Number(loc.quantity || 0), 0);

                materials[index] = item;
                localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
                return item;
            }
        }
        return null;
    },

    deleteMaterial: (id) => {
        const materials = storage.getMaterials();
        const filtered = materials.filter(m => m.id !== id);
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(filtered));
        return filtered;
    }
};

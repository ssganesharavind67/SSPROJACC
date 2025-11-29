import { storage } from './storage';

export const aiService = {
    // Mock function to generate a weekly playbook based on project status
    generatePlaybook: () => {
        const projects = storage.getProjects();
        const lowStockMaterials = storage.getMaterials().filter(m => m.stock <= m.reorderLevel);
        const pendingExpenses = storage.getExpenses().filter(e => !e.projectId);

        const playbook = {
            date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            focusAreas: [],
            tasks: [],
            insights: []
        };

        if (projects.some(p => p.status === 'In Progress')) {
            playbook.focusAreas.push({
                title: 'Project Momentum',
                description: 'Ensure active projects hit their weekly milestones. Check labour attendance logs.'
            });
        }
        if (lowStockMaterials.length > 0) {
            playbook.focusAreas.push({
                title: 'Inventory Replenishment',
                description: `${lowStockMaterials.length} items are running low. Prioritize ordering to avoid delays.`
            });
        }

        projects.forEach(p => {
            if (p.status === 'In Progress') {
                playbook.tasks.push({
                    id: `task-${p.id}`,
                    project: p.name,
                    action: 'Verify weekly progress against timeline',
                    priority: 'High'
                });
            }
        });
        lowStockMaterials.forEach(m => {
            playbook.tasks.push({
                id: `mat-${m.id}`,
                project: 'Inventory',
                action: `Order ${m.name} (Current: ${m.stock} ${m.unit})`,
                priority: 'Urgent'
            });
        });

        const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
        const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
        const budgetUsage = (totalSpent / totalBudget) * 100;

        if (budgetUsage > 70) {
            playbook.insights.push('Overall budget utilization is high (70%+). Review expense categories for potential savings.');
        } else {
            playbook.insights.push('Budget utilization is healthy. You have room to allocate funds for advanced equipment.');
        }

        return playbook;
    },

    chat: async (message) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const lowerMsg = message.toLowerCase();
                let response = "I'm not sure about that. Try asking about projects, inventory, expenses, payments, tasks, or daily logs.";

                const projects = storage.getProjects();
                const materials = storage.getMaterials();
                const expenses = storage.getExpenses();
                const tasks = storage.getTasks();
                const logs = JSON.parse(localStorage.getItem('bb_logs') || '[]');
                const payments = JSON.parse(localStorage.getItem('bb_payments') || '[]');
                const vendors = JSON.parse(localStorage.getItem('bb_vendors') || '[]');

                // Greeting (only at start)
                if (/^(hello|hi|hey)\b/.test(lowerMsg)) {
                    response = "Hello! I'm BuildBuddy, your AI construction assistant. I can help you with projects, inventory, expenses, payments, tasks, daily logs, and more. What would you like to know?";
                }
                // Project-specific payment query
                else if ((lowerMsg.includes('received') || lowerMsg.includes('payment') || lowerMsg.includes('inflow') || lowerMsg.includes('amount')) &&
                    (lowerMsg.includes(' in ') || lowerMsg.includes(' from ') || lowerMsg.includes(' for ') || lowerMsg.includes(' at '))) {
                    let foundProject = null;
                    for (const project of projects) {
                        if (lowerMsg.includes(project.name.toLowerCase())) {
                            foundProject = project;
                            break;
                        }
                    }

                    if (foundProject) {
                        const projectPayments = payments.filter(p => p.projectId === foundProject.id);
                        const totalReceived = projectPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

                        if (projectPayments.length > 0) {
                            response = `For "${foundProject.name}": You have received ₹${totalReceived.toLocaleString()} across ${projectPayments.length} payment(s).`;
                            const recentPayment = projectPayments.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                            response += ` Latest payment: ₹${Number(recentPayment.amount).toLocaleString()} on ${recentPayment.date}.`;
                        } else {
                            response = `No payments have been recorded yet for "${foundProject.name}".`;
                        }
                    } else {
                        response = "I couldn't find that project. Please check the project name and try again.";
                    }
                }
                // Project-specific expense query
                else if ((lowerMsg.includes('spent') || lowerMsg.includes('expense') || lowerMsg.includes('cost')) &&
                    (lowerMsg.includes(' in ') || lowerMsg.includes(' on ') || lowerMsg.includes(' for '))) {
                    let foundProject = null;
                    for (const project of projects) {
                        if (lowerMsg.includes(project.name.toLowerCase())) {
                            foundProject = project;
                            break;
                        }
                    }

                    if (foundProject) {
                        const projectExpenses = expenses.filter(e => e.projectId === foundProject.id);
                        const totalSpent = projectExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
                        response = `For "${foundProject.name}": Total spent is ₹${totalSpent.toLocaleString()} across ${projectExpenses.length} expense(s). Budget: ₹${foundProject.budget.toLocaleString()}, Remaining: ₹${(foundProject.budget - totalSpent).toLocaleString()}.`;
                    } else {
                        response = "I couldn't find that project. Please check the project name and try again.";
                    }
                }
                // General payment query
                else if (lowerMsg.includes('payment') || lowerMsg.includes('inflow')) {
                    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    const monthlyPayments = payments.filter(p => {
                        const d = new Date(p.date);
                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    }).reduce((sum, p) => sum + Number(p.amount || 0), 0);

                    response = `Total payments received this month: ₹${monthlyPayments.toLocaleString()}. Total lifetime payments: ₹${totalPayments.toLocaleString()} (${payments.length} transactions).`;
                }
                // Project status
                else if (lowerMsg.includes('project') || lowerMsg.includes('status')) {
                    const activeProjects = projects.filter(p => p.status === 'In Progress');
                    const delayedProjects = projects.filter(p => p.status === 'On Hold' || p.status === 'Delayed');
                    const completedProjects = projects.filter(p => p.status === 'Completed');

                    if (activeProjects.length > 0) {
                        const names = activeProjects.map(p => `"${p.name}"`).join(', ');
                        response = `You have ${activeProjects.length} active project(s): ${names}.`;
                        if (delayedProjects.length > 0) response += ` ${delayedProjects.length} project(s) are on hold/delayed.`;
                        if (completedProjects.length > 0) response += ` ${completedProjects.length} project(s) completed.`;
                    } else {
                        response = `You currently have no active projects. Total projects: ${projects.length} (${completedProjects.length} completed).`;
                    }
                }
                // Tasks
                else if (lowerMsg.includes('task') || lowerMsg.includes('playbook') || lowerMsg.includes('todo')) {
                    const pendingTasks = tasks.filter(t => !t.completed);
                    const completedTasks = tasks.filter(t => t.completed);
                    const highPriorityTasks = pendingTasks.filter(t => t.priority === 'High');
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const overdueTasks = pendingTasks.filter(t => {
                        if (!t.dueDate) return false;
                        const due = new Date(t.dueDate);
                        return due < today;
                    });

                    if (pendingTasks.length > 0) {
                        response = `You have ${pendingTasks.length} pending task(s).`;
                        if (overdueTasks.length > 0) response += ` ⚠️ ${overdueTasks.length} task(s) are overdue!`;
                        if (highPriorityTasks.length > 0) response += ` ${highPriorityTasks.length} high-priority task(s) need attention.`;
                        response += ` ${completedTasks.length} task(s) completed.`;
                    } else {
                        response = `Great! You have no pending tasks. ${completedTasks.length} task(s) completed.`;
                    }
                }
                // Daily logs
                else if (lowerMsg.includes('log') || lowerMsg.includes('daily')) {
                    if (logs.length > 0) {
                        const recentLogs = logs.slice(-5);
                        response = `You have ${logs.length} daily log(s) recorded. Latest log: ${new Date(recentLogs[recentLogs.length - 1]?.date).toLocaleDateString()}.`;
                    } else {
                        response = "No daily logs recorded yet. Start tracking your daily work progress!";
                    }
                }
                // Vendors
                else if (lowerMsg.includes('vendor') || lowerMsg.includes('supplier')) {
                    if (vendors.length > 0) {
                        const activeVendors = vendors.filter(v => v.status === 'Active');
                        response = `You have ${vendors.length} vendor(s) in your database. ${activeVendors.length} are currently active.`;
                    } else {
                        response = "No vendors added yet. Add vendors to track your suppliers and contractors.";
                    }
                }
                // Inventory
                else if (lowerMsg.includes('material') || lowerMsg.includes('stock') || lowerMsg.includes('inventory')) {
                    const lowStock = materials.filter(m => Number(m.stock) <= Number(m.reorderLevel || 0));
                    const tools = materials.filter(m => m.type === 'Tool');
                    const rawMaterials = materials.filter(m => m.type === 'Material');

                    if (lowStock.length > 0) {
                        const items = lowStock.map(m => `${m.name} (${m.stock} ${m.unit})`).join(', ');
                        response = `⚠️ Attention: ${lowStock.length} item(s) running low: ${items}. Please restock soon.`;
                    } else {
                        response = `Inventory is healthy! You have ${materials.length} total items (${rawMaterials.length} materials, ${tools.length} tools), and none are below reorder levels.`;
                    }
                }
                // Expenses
                else if (lowerMsg.includes('expense') || lowerMsg.includes('budget') || lowerMsg.includes('spend')) {
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    const monthlySpend = expenses.filter(e => {
                        const d = new Date(e.date);
                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    }).reduce((sum, e) => sum + Number(e.amount || 0), 0);
                    const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
                    const categoryBreakdown = expenses.reduce((acc, e) => {
                        acc[e.category] = (acc[e.category] || 0) + Number(e.amount || 0);
                        return acc;
                    }, {});
                    const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];

                    response = `Total spending this month: ₹${monthlySpend.toLocaleString()}. Total lifetime spending: ₹${totalSpend.toLocaleString()} (${expenses.length} transactions).`;
                    if (topCategory) response += ` Top expense category: ${topCategory[0]} (₹${topCategory[1].toLocaleString()}).`;
                }
                // Summary
                else if (lowerMsg.includes('summary') || lowerMsg.includes('overview') || lowerMsg.includes('report')) {
                    const activeProjects = projects.filter(p => p.status === 'In Progress').length;
                    const pendingTasks = tasks.filter(t => !t.completed).length;
                    const lowStock = materials.filter(m => Number(m.stock) <= Number(m.reorderLevel || 0)).length;
                    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
                    const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

                    response = `📊 Quick Summary:\n• ${activeProjects} active project(s)\n• ${pendingTasks} pending task(s)\n• ${lowStock} low-stock item(s)\n• Total spent: ₹${totalSpent.toLocaleString()}\n• Total received: ₹${totalReceived.toLocaleString()}\n• Net balance: ₹${(totalReceived - totalSpent).toLocaleString()}`;
                }

                resolve(response);
            }, 800);
        });
    }
};

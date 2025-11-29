/**
 * Parses natural language input for expenses and payments
 * Example inputs:
 * "50000 bricks Madhu site" -> { amount: 50000, category: 'Materials', project: 'Madhu site', type: 'expense' }
 * "Paid 25000 cement Riverside" -> { amount: 25000, category: 'Materials', project: 'Riverside', type: 'expense' }
 * "Received 100000 from client Madhu" -> { amount: 100000, category: 'Payment', project: 'Madhu', type: 'payment' }
 */

export const parseInputText = (text, projects = []) => {
    const lowerText = text.toLowerCase();

    // 1. Extract Amount
    // Matches numbers like 50000, 50,000, 50k, 50.5
    const amountMatch = text.match(/(\d+(?:,\d+)*(?:\.\d+)?)(?:k)?/i);
    let amount = 0;
    if (amountMatch) {
        let rawAmount = amountMatch[1].replace(/,/g, '');
        amount = parseFloat(rawAmount);
        if (text.toLowerCase().includes(amountMatch[0].toLowerCase()) && amountMatch[0].toLowerCase().endsWith('k')) {
            amount *= 1000;
        }
    }

    // 2. Determine Type (Expense vs Payment)
    let type = 'expense';
    if (lowerText.includes('received') || lowerText.includes('payment') || lowerText.includes('inflow') || lowerText.includes('from client')) {
        type = 'payment';
    }

    // 3. Extract Project
    // Try to match with existing projects first
    let projectId = '';
    let projectName = '';

    // Sort projects by name length (descending) to match longest names first
    const sortedProjects = [...projects].sort((a, b) => b.name.length - a.name.length);

    for (const project of sortedProjects) {
        if (lowerText.includes(project.name.toLowerCase())) {
            projectId = project.id;
            projectName = project.name;
            break;
        }
    }

    // If no exact match, look for "in [Project]" or "at [Project]" or "for [Project]"
    if (!projectId) {
        const projectMatch = text.match(/(?:in|at|for)\s+([A-Z][a-z0-9\s]+)(?:site|project)?/i);
        if (projectMatch && projectMatch[1]) {
            // This is a guess, might not match an ID, but useful for display
            projectName = projectMatch[1].trim();
        }
    }

    // 4. Extract Category (for expenses)
    let category = 'Other';
    const categories = {
        'Materials': ['brick', 'cement', 'sand', 'steel', 'wood', 'paint', 'tile', 'material'],
        'Labor': ['labor', 'labour', 'worker', 'mason', 'carpenter', 'painter', 'salary', 'wage'],
        'Equipment': ['machine', 'jcb', 'crane', 'drill', 'tool', 'equipment'],
        'Transport': ['transport', 'fuel', 'diesel', 'petrol', 'driver', 'vehicle'],
        'Utilities': ['bill', 'electricity', 'water', 'internet'],
        'Permits': ['permit', 'license', 'approval', 'tax']
    };

    if (type === 'expense') {
        for (const [cat, keywords] of Object.entries(categories)) {
            if (keywords.some(k => lowerText.includes(k))) {
                category = cat;
                break;
            }
        }
    } else {
        category = 'Payment';
    }

    // 5. Extract Description
    // Remove amount and common words to leave the rest as description
    let description = text
        .replace(amountMatch ? amountMatch[0] : '', '')
        .replace(/received|paid|spent|for|in|at|from|client/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Capitalize first letter
    description = description.charAt(0).toUpperCase() + description.slice(1);

    return {
        amount,
        type,
        projectId,
        projectName, // For display/confirmation if ID not found
        category,
        description,
        originalText: text
    };
};

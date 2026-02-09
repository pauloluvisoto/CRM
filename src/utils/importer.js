import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

export const parseFile = (file) => {
    return new Promise((resolve, reject) => {
        const fileExt = file.name.split('.').pop().toLowerCase();

        if (fileExt === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: (error) => reject(error),
            });
        } else if (['xlsx', 'xls'].includes(fileExt)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                resolve(jsonData);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        } else {
            reject(new Error('Unsupported file type'));
        }
    });
};

export const createPipelineFromData = async (config, data) => {
    // config: { name, createMethod, statusColumn }
    const { name, statusColumn } = config;
    let stageNames = [];

    // 1. Determine Stage Names
    if (config.createMethod === 'kanban') {
        // Use selected stages from config, or fallback to all headers if not provided (though config should have them)
        // If selectedStages is undefined, we might be in a legacy call?
        if (config.selectedStages && config.selectedStages.length > 0) {
            stageNames = config.selectedStages;
        } else {
            // Fallback if no specific stages selected? Maybe passing 'headers' in config would be good?
            // For now, if no stages selected in Kanban, we loop headers?
            // But we don't have headers here in 'data' except the keys of the first row?
            if (data.length > 0) {
                stageNames = Object.keys(data[0]);
            }
        }
    } else if (statusColumn) {
        // Status Column Mode
        const uniqueStatuses = [...new Set(
            data.map(row => row[statusColumn]).filter(val => val && val.toString().trim() !== '')
        )];
        stageNames = uniqueStatuses;
    }

    if (stageNames.length === 0) {
        stageNames = ['Novo Lead', 'Em Andamento', 'Concluído']; // Better Fallback
    }

    // 2. Create Pipeline Record
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado. Por favor, faça login novamente.");

    const { data: pipeline, error: pipelineError } = await supabase
        .from('pipelines')
        .insert({ name: name, user_id: user.id })
        .select()
        .single();

    if (pipelineError) {
        console.error('Error creating pipeline:', pipelineError);
        throw new Error(`Erro ao criar pipeline: ${pipelineError.message}`);
    }

    const createdColumns = [];

    // 3. Create Columns linked to Pipeline
    for (let i = 0; i < stageNames.length; i++) {
        let stageName = stageNames[i];
        if (!stageName) stageName = `Etapa ${i + 1}`; // Safety for empty names

        // Create ID from pipeline name + stage name to ensure uniqueness
        const id = `${name}-${stageName}`.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '')
            + '-' + Math.random().toString(36).substring(2, 7);

        const { data: col, error } = await supabase
            .from('pipeline_stages')
            .insert({
                id,
                name: stageName, // Standardized column name in new table
                position: i + 1,
                pipeline_id: pipeline.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating column:', error);
            // Don't throw, just log. Partial import is better than no import.
        } else {
            createdColumns.push(col);
        }
    }

    return createdColumns;
};

export const processImport = async (data, mapping, options, onProgress) => {
    let successCount = 0;
    let errors = [];

    // options can be:
    // { mode: 'existing', columnId: 'xyz' }
    // { mode: 'new', columns: [...], statusColumn: 'Status' (optional) }

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        let targetColumnId;

        if (options.mode === 'existing') {
            targetColumnId = options.columnId;
        } else {
            // New pipeline mode
            if (options.statusColumn && row[options.statusColumn]) {
                // Find matching column by title
                const statusVal = row[options.statusColumn];
                const col = options.columns.find(c => c.title === statusVal);
                targetColumnId = col ? col.id : options.columns[0].id;
            } else {
                // Default to first column if no status mapping or empty status
                targetColumnId = options.columns[0].id;
            }
        }

        let deal = {
            column_id: targetColumnId,
            user_id: userId,
            created_at: new Date(),
        };

        // Apply Mapping
        if (mapping.title && row[mapping.title]) deal.title = row[mapping.title];
        else deal.title = 'Sem Título';

        if (mapping.value && row[mapping.value]) {
            let val = row[mapping.value].toString();
            val = val.replace(/[^\d,\.-]/g, '').replace(',', '.');
            deal.value = parseFloat(val) || 0;
        } else {
            deal.value = 0;
        }

        if (mapping.company && row[mapping.company]) deal.company = row[mapping.company];
        if (mapping.instagram && row[mapping.instagram]) deal.instagram = row[mapping.instagram];
        if (mapping.whatsapp && row[mapping.whatsapp]) deal.whatsapp = row[mapping.whatsapp];

        deal.tags = ['Importado'];

        try {
            const { error } = await supabase.from('deals').insert(deal);
            if (error) throw error;
            successCount++;
        } catch (err) {
            console.error('Import Error Row ' + i, err);
            errors.push({ row: i + 1, error: err.message });
        }

        if (onProgress) onProgress(Math.round(((i + 1) / data.length) * 100));
    }

    return { successCount, errors };
};

export const processKanbanImport = async (data, headers, pipelineName, onProgress, createdColumns) => {
    let successCount = 0;
    let errors = [];

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Map Title -> Column ID
    const columnsMap = new Map();
    if (createdColumns && Array.isArray(createdColumns)) {
        createdColumns.forEach(c => columnsMap.set(c.title, c.id));
    }

    const totalRows = data.length;

    for (let i = 0; i < totalRows; i++) {
        const row = data[i];

        // In Kanban mode, we iterate through HEADERS to find which ones are STAGES.
        // We look up if this header exists in our columnsMap.
        // If it does, the values in this column for this row are LEADS for that stage.

        for (const header of headers) {

            // 1. Is this header a stage?
            const columnId = columnsMap.get(header);
            if (!columnId) continue; // Not a valid stage column

            // 2. Does this cell have a Lead Name?
            const cellValue = row[header];
            if (!cellValue || cellValue.toString().trim() === '') continue; // Empty cell

            // 3. Create Deal
            // We need to parse other fields? 
            // The user request said "leads estarão nas seções ja com link de instagram e whatsapp".
            // This is tricky. If the cell is JUST the name, where are the links?
            // If the user implies the cell text HAS the links, we can try to smart parse.
            // OR if there are separate columns for them, but that contradicts "Kanban" where row=lead.
            // Assumption: Standard Kanban = One Lead per Cell. 
            // But if the user has multiple property columns, they apply to which lead?
            // USUALLY Kanban imports in Excel are:
            // | Stage A | Stage B |
            // | Lead 1  | Lead 2  |
            // | Lead 3  |         |

            // In this format, "Value" or "Phone" columns don't make sense unless they are embedded in the text.
            // HOWEVER, we will support a "Smart Parse" of the cell value just in case?
            // "Paulo - 119999 - @paulo"

            let dealTitle = cellValue.toString();
            let dealValue = 0;
            let dealPhone = null;
            let dealInsta = null;

            // Simple Smart Parse (Hypothetical support for "Name - Phone")
            if (dealTitle.includes(' - ')) {
                const parts = dealTitle.split(' - ');
                dealTitle = parts[0];
                // Try to find phone or money in other parts
                parts.forEach(p => {
                    if (p.includes('@')) dealInsta = p;
                    else if (p.match(/\d{8,}/)) dealPhone = p; // Rough phone check
                });
            }

            const deal = {
                title: dealTitle,
                column_id: columnId,
                user_id: userId,
                value: dealValue,
                whatsapp: dealPhone,
                instagram: dealInsta,
                tags: ['Importado'],
                created_at: new Date()
            };

            try {
                const { error } = await supabase.from('deals').insert(deal);
                if (error) throw error;
                successCount++;
            } catch (err) {
                console.error('Error adding deal', err);
                errors.push({ row: i + 1, error: `Erro na coluna "${header}": ${err.message}` });
            }
        }

        if (onProgress) onProgress(Math.round(((i + 1) / totalRows) * 100));
    }

    return { successCount, errors };
};

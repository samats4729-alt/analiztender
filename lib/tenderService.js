import { supabase } from './supabaseClient';

// Get all tenders
export async function getTenders() {
    const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tenders:', error);
        return [];
    }
    return data;
}

// Add a new tender
export async function addTender(tender) {
    // Remove ID if present (let DB handle it) or handle manual ID
    const { id, ...tenderData } = tender;

    // Ensure numeric fields are numbers or null
    const cleanData = {
        ...tenderData,
        price: tenderData.price ? parseFloat(tenderData.price) : null,
        carrier_price: tenderData.carrierPrice ? parseFloat(tenderData.carrierPrice) : null, // Note mapping: camelCase JS -> snake_case DB if needed, but we used snake_case in SQL. Wait, let's match.
        // Actually, let's keep it simple. If DB has snake_case columns, we should map.
        // Based on SQL: carrier_price
    };

    // Mapping for DB
    const dbPayload = {
        origin: cleanData.origin,
        destination: cleanData.destination,
        date: cleanData.date,
        weight: cleanData.weight,
        price: cleanData.price,
        carrier_price: cleanData.carrier_price,
        pallets: cleanData.pallets,
        cubes: cleanData.cubes,
        places: cleanData.places,
        status: cleanData.status,
        comment: cleanData.comment
    };

    const { data, error } = await supabase
        .from('tenders')
        .insert([dbPayload])
        .select();

    if (error) {
        console.error('Error adding tender:', error);
        return null;
    }
    return data[0];
}

// Delete a tender
export async function deleteTender(id) {
    const { error } = await supabase
        .from('tenders')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting tender:', error);
        return false;
    }
    return true;
}

// Clear all tenders (Dangerous)
export async function clearTenders() {
    // Supabase delete requires a where clause. delete all where id > 0
    const { error } = await supabase
        .from('tenders')
        .delete()
        .gt('id', 0);

    if (error) {
        console.error('Error clearing tenders:', error);
        return false;
    }
    return true;
}

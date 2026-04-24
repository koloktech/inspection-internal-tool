/**
 * Predefined description suggestions per defect category.
 * Common home defects found during property inspections in Malaysia.
 */
const DEFECT_CATEGORIES = [
    'Wall',
    'Ceilings',
    'Tiles',
    'Floor',
    'Plumbing/Sanitary',
    'Doors',
    'Windows',
    'Electrical',
    'Gate',
    'Painting',
    'Water Ponding Test',
    'Others'
];

const DEFECT_DESCRIPTIONS = {
    'Wall': [
        'Hairline cracks observed on the wall surface.',
        'Horizontal cracks observed on the wall surface.',
        'Visible roller marks with incomplete / uneven paintwork.',
        'Paint coverage is inconsistent with visible unpainted sections.',
        'Paint roller marks, surface holes, and staining observed on the painted surface.',
        'Unfinished paintwork noted at the affected area.',
        'Wall surface shows signs of inadequate finishing, including patchy areas and uneven texture.',
        'Visible patching / touch-up marks observed on the wall surface due to poor patchwork.',
        'Poor plastering / skim coat workmanship observed with uneven finishing to the wall surface.',
        'Poor wall finishing workmanship observed at the affected area.',
        'Visible gap noted along the wall-lining/skirting junction.',
        'Stain observed on the wall surface suspected due to moisture / water seepage.',
        'Areas with high moisture were identified, with the presence of water marks / seepage stains.',
        'Hollow concrete detected upon tapping test at the wall surface.',
        'Crack observed at the wall-to-ceiling joint.',
        'Chipped / damaged plaster observed on the wall.',
        'Bulging / uneven wall surface detected.',
        'Nail / screw pop visible on the wall surface.',
        'Mould / fungal growth observed on the wall surface.',
        'Efflorescence (white salt deposits) visible on the wall.',
        'High moisture content detected via damp meter; visible water marks and active seepage observed.',
        'Gap between wall and window/door frame observed.',
        'Missing / uninstalled wall-mounted component (e.g. skirting, cove, corner guard, wall panel) as per S&P/SPA specification.'
    ],
    'Ceilings': [
        'Hairline cracks observed at the ceiling surface.',
        'Crack observed at the ceiling-to-wall joint.',
        'Obvious crack suspected to be critical (due to potential deep cracking or structural concerns).',
        'Uneven / sagging ceiling surface detected.',
        'Water stain marks observed on the ceiling.',
        'Incomplete paintwork on the ceiling surface.',
        'Visible roller marks and uneven paint finish on the ceiling.',
        'Peeling / flaking paint on the ceiling surface.',
        'Poor patching / repair workmanship observed at the ceiling surface.',
        'Poor installation / alignment of ceiling board / panel observed at the affected area.',
        'Poor ceiling finishing workmanship observed at the joint / corner / access panel area.',
        'Hollow sound detected upon tapping test on the ceiling.',
        'Mould / discoloration observed on the ceiling.',
        'Missing / uninstalled ceiling component (e.g. ceiling panel, access panel, cornice, light fitting) as per S&P/SPA specification.'
    ],
    'Tiles': [
        'Hollow tiles detected during tapping test as marked with sticker.',
        'Chipped / cracked tile observed at the affected area.',
        'Uneven tile surface / lippage detected between adjacent tiles.',
        'Missing / incomplete grouting between tiles.',
        'Stained / discolored grout lines observed.',
        'Tile edge chipping noted at the corner / junction.',
        'Loose tile detected upon tapping.',
        'Misaligned tile layout observed.',
        'Scratched tile surface noted.',
        'Gap between tile and wall/skirting junction.',
        'Poor tile installation workmanship observed with inconsistent alignment / joint spacing.',
        'Insufficient tile bedding / adhesive coverage suspected from hollowness and poor bonding.',
        'Poor tile cutting / finishing observed at edge / corner / fitting junction.',
        'Missing / uninstalled tiles at the affected area as per S&P/SPA specification.'
    ],
    'Floor': [
        'Uneven floor surface detected.',
        'Scratches observed on the floor surface.',
        'Floor level difference / stepping between rooms.',
        'Hollow floor detected during tapping test.',
        'Water ponding observed on the floor surface.',
        'Gap between floor and skirting / wall junction.',
        'Cracked floor finish observed.',
        'Stain marks on the floor surface.',
        'Missing / damaged floor skirting.',
        'Poor floor finishing workmanship observed at the affected area.',
        'Poor patch repair / surface make-good observed on the floor finish.',
        'Poor installation / alignment of skirting / floor finish observed.',
        'Poor screed / floor fall workmanship suspected from unevenness / drainage issue.',
        'Missing / uninstalled floor component (e.g. floor skirting, floor trap cover, threshold strip) as per S&P/SPA specification.'
    ],
    'Plumbing/Sanitary': [
        'Active leakage observed at the pipe joint / connection.',
        'Active leakage observed at the toilet hose connection.',
        'Hollow tiles detected within the washroom walls.',
        'Missing silicone sealant at the sink / basin junction.',
        'Water tap dripping / not functioning properly.',
        'Poor water pressure detected at the tap / shower.',
        'Toilet bowl not flushing properly / weak flush.',
        'Water stain marks observed below the pipe.',
        'Drain blockage / slow drainage observed.',
        'Pipe fitting loose / not secured properly.',
        'Missing / damaged pipe cover / cap.',
        'Basin / sink not properly sealed to countertop.',
        'Floor trap not functioning / slow drainage.',
        'Shower head fitting loose / leaking.',
        'Poor installation workmanship observed to the sanitary fitting / pipe connection.',
        'Poor silicone / sealant workmanship observed around sanitary fitting junction.',
        'Poor workmanship observed to pipe alignment / support / finishing at the affected area.',
        'Poor installation of basin / WC / tap fitting observed with unsatisfactory finishing.',
        'Missing / uninstalled sanitary ware or plumbing component (e.g. basin, WC, shower set, tap, towel rail, toilet roll holder, soap dish, mirror) as per S&P/SPA specification.'
    ],
    'Doors': [
        'Door surface exhibits stains, patching marks, and uneven paintwork.',
        'Dented / Crack point observed at the corner of the door frame.',
        'Door not closing / latching properly.',
        'Door hinge squeaking / loose.',
        'Gap between door and door frame (uneven gap).',
        'Door lock / handle not functioning properly.',
        'Scratched / damaged door surface.',
        'Door frame chipped paint / damaged.',
        'Door stopper missing / not installed.',
        'Door rubbing against floor / frame.',
        'Swollen / warped door panel due to moisture.',
        'Poor installation / alignment of door frame observed.',
        'Poor workmanship observed to door hardware installation / finishing.',
        'Visible patching / touch-up marks observed on the door / frame surface.',
        'Missing / uninstalled door component (e.g. door leaf, door handle, lock set, door stopper, hinges, door closer) as per S&P/SPA specification.'
    ],
    'Windows': [
        'Hairline cracks observed at the window frame area.',
        'Hollow concrete and water seepage stains recorded below the window lintel.',
        'Window not closing / locking properly.',
        'Window handle / latch not functioning.',
        'Gap between window frame and wall (missing sealant).',
        'Scratched / damaged window glass.',
        'Window sliding track dirty / obstructed.',
        'Rubber seal / gasket damaged / missing.',
        'Water seepage through window frame during rain.',
        'Mosquito mesh damaged / not fitted properly.',
        'Poor installation / alignment of window frame observed.',
        'Poor sealant application observed at window perimeter joint.',
        'Poor workmanship observed to window frame / glazing / beading installation.',
        'Missing / uninstalled window component (e.g. window handle, latch, mosquito mesh, glass panel, rubber seal) as per S&P/SPA specification.'
    ],
    'Electrical': [
        'Power socket found to be loose upon inspection.',
        'Switch point has chipped paint and stains.',
        'Water heater unit not functioning.',
        'Heater switch physically difficult to press.',
        'Loose / damaged socket cover plate.',
        'Light switch not functioning.',
        'Light fitting / bulb not working.',
        'Exposed wiring observed at the affected area.',
        'DB box exhibits unpainted areas and accumulated debris.',
        'Ceiling fan wobbling / noisy during operation.',
        'Doorbell not functioning.',
        'Earthing / grounding issue detected during testing.',
        'Socket tester showing wiring fault.',
        'Poor installation workmanship observed at socket / switch point.',
        'Poor patchwork / finishing observed around the electrical point.',
        'Electrical accessories observed to be misaligned / not installed neatly.',
        'Poor cable management / containment finishing observed at the affected area.',
        'Missing / uninstalled electrical component (e.g. socket, switch, light fitting, DB cover, doorbell, water heater) as per S&P/SPA specification.'
    ],
    'Gate': [
        'Gate not closing / latching properly.',
        'Gate hinge rusty / squeaking.',
        'Uneven gap between gate panels.',
        'Gate lock / latch not functioning.',
        'Rust / corrosion observed on the gate surface.',
        'Gate auto-closer not functioning.',
        'Scratched / damaged gate surface.',
        'Gate post not properly aligned / leaning.',
        'Poor gate installation / alignment workmanship observed.',
        'Poor welding / joint finishing observed at the gate frame.',
        'Poor paint / coating workmanship observed on the gate surface.',
        'Missing / uninstalled gate component (e.g. gate leaf, lock, latch, auto-closer, post cap) as per S&P/SPA specification.'
    ],
    'Painting': [
        'Visible roller marks on the painted surface.',
        'Uneven / patchy paint coverage.',
        'Paint drips / sags observed.',
        'Different paint color / shade inconsistency between areas.',
        'Unpainted areas / missed spots.',
        'Paint peeling / flaking.',
        'Paint bubbling on the surface.',
        'Brush marks visible on the painted surface.',
        'Overspray / paint splatter on fixtures / fittings.',
        'Touch-up marks visible (color mismatch).',
        'Poor patchwork observed below the paint finish.',
        'Poor surface preparation suspected from visible patch marks / uneven finishing.',
        'Poor painting workmanship observed with inconsistent finishing quality.',
        'Poor workmanship observed at paint line / cut edge / corner finishing.',
        'Missing / incomplete painting at the affected area as per S&P/SPA specification.'
    ],
    'Water Ponding Test': [
        'Water ponding test conducted - leakage detected at the ceiling below.',
        'Water ponding test conducted - no leakage detected (passed).',
        'Water ponding test - slow seepage observed at the joint/edge.',
        'Water ponding test - water level dropping, suspected leakage.',
        'Ponding area shows improper gradient / water not draining.',
        'Poor waterproofing workmanship suspected at the tested area.',
        'Poor installation / finishing observed at waterproofing upturn / outlet / joint.',
        'Poor floor fall / screed workmanship suspected from ponding condition.',
        'Missing / uninstalled waterproofing component (e.g. floor trap, outlet, membrane upturn) at the tested area as per S&P/SPA specification.'
    ],
    'Others': [
        'Defect observed at the affected area (please specify in remarks).',
        'Incomplete work noted at the affected area.',
        'Damaged fitting / fixture observed.',
        'Safety concern identified at the affected area.',
        'Cleaning required - debris / construction waste left.',
        'Missing component / fitting at the affected area.',
        'Poor workmanship observed at the affected area.',
        'Poor installation observed at the affected area.',
        'Poor patching / make-good observed at the affected area.',
        'Missing / uninstalled component or fitting at the affected area as per S&P/SPA specification.'
    ]
};

function normalizeDefectCategoriesInput(categoriesOrString) {
    if (Array.isArray(categoriesOrString)) {
        return categoriesOrString.filter(category => DEFECT_CATEGORIES.includes(category));
    }

    if (typeof categoriesOrString !== 'string' || !categoriesOrString.trim()) {
        return [];
    }

    if (DEFECT_CATEGORIES.includes(categoriesOrString)) {
        return [categoriesOrString];
    }

    return categoriesOrString
        .split(' + ')
        .map(category => category.trim())
        .filter(category => DEFECT_CATEGORIES.includes(category));
}

function getDefectDescriptionSuggestions(categoriesOrString) {
    const categories = normalizeDefectCategoriesInput(categoriesOrString);
    const suggestions = [];

    categories.forEach(category => {
        (DEFECT_DESCRIPTIONS[category] || []).forEach(description => {
            if (!suggestions.includes(description)) {
                suggestions.push(description);
            }
        });
    });

    return suggestions;
}

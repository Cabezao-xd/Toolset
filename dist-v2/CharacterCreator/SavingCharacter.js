// ============================================================
// SavingCharacter.js — Muestra el JSON para guardarlo a mano
// ============================================================

function saveCharacter() {
    if (!currentCharacter.name) {
        showError('Please enter a character name before saving.');
        return;
    }
    mostrarJSONPersonaje();
}

function mostrarJSONPersonaje() {
    const data = generateSaveData();
    const json = JSON.stringify(data, null, 2);

    const nombreLimpio = (currentCharacter.name || 'personaje')
        .replace(/[^a-zA-Z0-9_\-áéíóúñÁÉÍÓÚÑ]/g, '_')
        .trim() || 'personaje';
    const filename = `${nombreLimpio}.json`;

    console.log('[CC] Personaje generado: ' + filename + ' (' + json.length + ' chars).');
    mostrarModal(filename, json);
}

function mostrarModal(filename, json) {
    // Evitar duplicados si se pulsa dos veces
    const existente = document.getElementById('ts5e-save-modal');
    if (existente) existente.remove();

    const o = document.createElement('div');
    o.id = 'ts5e-save-modal';
    o.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;';

    const c = document.createElement('div');
    c.style.cssText = 'background:#1c1c1c;color:#edf1e8;padding:20px;border-radius:10px;border:1px solid #3a4a36;max-width:750px;width:90%;max-height:85vh;display:flex;flex-direction:column;';

    const h = document.createElement('h3');
    h.textContent = 'Guardar como: ' + filename;
    h.style.cssText = 'margin:0 0 8px 0;';
    c.appendChild(h);

    const p = document.createElement('p');
    p.textContent = 'Pulsa "Copiar todo" y pega el contenido en un archivo llamado "' + filename + '". Después impórtalo en el Toolset.';
    p.style.cssText = 'margin:0 0 12px 0;font-size:13px;opacity:.8;line-height:1.5;';
    c.appendChild(p);

    const ta = document.createElement('textarea');
    ta.value = json;
    ta.style.cssText = 'flex:1;min-height:320px;background:#121711;color:#edf1e8;border:1px solid #4a5a46;border-radius:6px;padding:8px;font-family:monospace;font-size:12px;resize:vertical;';
    c.appendChild(ta);

    const fila = document.createElement('div');
    fila.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:12px;';

    const cerrar = document.createElement('button');
    cerrar.textContent = 'Cerrar';
    cerrar.style.cssText = 'background:#2a3826;color:#d9bd73;border:1px solid #4a5a46;border-radius:6px;padding:8px 16px;cursor:pointer;font-weight:bold;';
    cerrar.onclick = () => o.remove();
    fila.appendChild(cerrar);

    const copiar = document.createElement('button');
    copiar.textContent = '📋 Copiar todo';
    copiar.style.cssText = 'background:#d9bd73;color:#1c1c1c;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-weight:bold;';
    copiar.onclick = async () => {
        // Intento 1: navigator.clipboard
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(json);
                copiar.textContent = '✅ Copiado';
                setTimeout(() => copiar.textContent = '📋 Copiar todo', 2000);
                return;
            }
        } catch (e) {
            console.warn('[CC] clipboard falló, usando fallback:', e);
        }
        // Intento 2: textarea + execCommand
        try {
            ta.focus();
            ta.select();
            document.execCommand('copy');
            copiar.textContent = '✅ Copiado';
            setTimeout(() => copiar.textContent = '📋 Copiar todo', 2000);
        } catch (e) {
            console.error('[CC] Fallback copia falló:', e);
            alert('No se pudo copiar automáticamente. Selecciona el texto y pulsa Ctrl+C.');
        }
    };
    fila.appendChild(copiar);

    c.appendChild(fila);
    o.appendChild(c);
    document.body.appendChild(o);

    ta.focus();
    ta.select();

    o.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') o.remove();
    });
}

// ============================================================
// generateSaveData — formato legacy que v2 sabe migrar
// ============================================================
function generateSaveData() {
	const name = currentCharacter.name || "Unnamed Character";
	const save = {};

	const proficiencyMappings = calculateProficiencyMappings();

	save[name] = {
		characterTempHp: "0",
		currentHitDice: currentCharacter.level.toString(),
		insp: 0,
		upcastToggle: 1,
		exhaustionToggle: 0,
		playerWeaponProficiency: getWeaponProficiencies(),
		playerArmorProficiency: getArmorProficiencies(),
		playerLanguageProficiency: (currentCharacter.languages && currentCharacter.languages.proficiencies) || [],
		playerToolsProficiency: getToolProficiencies(),
		initiativeButton: "0",
		AC: currentCharacter.armorClass.toString(),
		speed: currentCharacter.speed || "30ft.",
		characterLevel: currentCharacter.level.toString(),
		playerXP: currentCharacter.xp?.toString() || "0",
		playerClass: `${currentCharacter.class}${currentCharacter.subclass ? ` (${currentCharacter.subclass})` : ''}`,
		playerSpecies: `${currentCharacter.race}${currentCharacter.subrace ? ` (${currentCharacter.subrace})` : ''}`,
		currentCharacterHP: currentCharacter.trueHitPoints.toString(),
		maxCharacterHP: currentCharacter.trueHitPoints.toString(),

		trueStrengthScore: (currentCharacter.abilities?.strength || 10).toString(),
		trueDexterityScore: (currentCharacter.abilities?.dexterity || 10).toString(),
		trueConstitutionScore: (currentCharacter.abilities?.constitution || 10).toString(),
		trueIntelligenceScore: (currentCharacter.abilities?.intelligence || 10).toString(),
		trueWisdomScore: (currentCharacter.abilities?.wisdom || 10).toString(),
		trueCharismaScore: (currentCharacter.abilities?.charisma || 10).toString(),

		strengthScore: getTotalAbilityScore('strength').toString(),
		dexterityScore: getTotalAbilityScore('dexterity').toString(),
		constitutionScore: getTotalAbilityScore('constitution').toString(),
		intelligenceScore: getTotalAbilityScore('intelligence').toString(),
		wisdomScore: getTotalAbilityScore('wisdom').toString(),
		charismaScore: getTotalAbilityScore('charisma').toString(),

		abilityScoreMethod: currentCharacter.abilityScoreMethod || "manual",
		rolledAbilityScores: currentCharacter.rolledAbilityScores || [],
		individualRolls: currentCharacter.individualRolls || [],
		pointBuyPoints: currentCharacter.pointBuyPoints || 27,

		hitPointsRollCount: currentCharacter.hitPointsRollCount || 0,

		acrobaticsMod: "DEX",
		animalHandlingMod: "WIS",
		arcanaMod: "INT",
		athleticsMod: "STR",
		deceptionMod: "CHA",
		historyMod: "INT",
		insightMod: "WIS",
		intimidationMod: "CHA",
		investigationMod: "INT",
		medicineMod: "WIS",
		natureMod: "INT",
		perceptionMod: "WIS",
		performanceMod: "CHA",
		persuasionMod: "CHA",
		religionMod: "INT",
		sleightofHandMod: "DEX",
		stealthMod: "DEX",
		survivalMod: "WIS",

		hitDiceButton: `d${classesData?.classes?.[currentCharacter.class]?.hitDie || 10}`,

		...proficiencyMappings,

		conditions: [],
		coins: currentCharacter.coins || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
		actionTable: currentCharacter.actionTable || [],
		spellData: currentCharacter.spellData || {},
		inventoryData: currentCharacter.inventoryData || {
			equipment: [],
			backpack: [],
			"other-possessions": [],
			attunement: []
		},
		groupTraitData: collectGroupTraitsData() || [],
		groupNotesData: [],
		extrasData: []
	};

	return save;
}

function calculateProficiencyMappings() {
	const mappings = {};

	const skillsInOrder = [
		'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History',
		'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
		'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'
	];
	skillsInOrder.forEach((skill, index) => {
		const pbKey = `pb-${index + 1}`;
		mappings[pbKey] = getSkillProficiencyValue(skill);
	});

	const savesInOrder = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
	savesInOrder.forEach((save, index) => {
		const pbKey = `pb-${19 + index}`;
		mappings[pbKey] = getSavingThrowProficiencyValue(save);
	});

	return mappings;
}

function getProficiencyLevelName(value) {
	switch(value) {
		case 0: return 'Not Proficient';
		case 0.5: return 'Half Proficient';
		case 1: return 'Proficient';
		case 2: return 'Expertise';
		default: return 'Unknown';
	}
}

function checkForRemarkableAthlete() {
	return currentCharacter.class === 'fighter' &&
	       currentCharacter.subclass === 'Champion' &&
	       currentCharacter.level >= 7;
}

function getSkillProficiencyValue(skillName) {
	if (!currentCharacter.skills || !currentCharacter.skills.proficiencies) return 0;
	const isProficient = currentCharacter.skills.proficiencies.includes(skillName);
	const hasExpertise = currentCharacter.skills.expertise && currentCharacter.skills.expertise.includes(skillName);
	const hasHalfProficiency = currentCharacter.skills.halfProficiency && currentCharacter.skills.halfProficiency.includes(skillName);
	const hasRemarkableAthlete = checkForRemarkableAthlete();
	const remarkableAthleteSkills = ['Athletics', 'Acrobatics', 'Sleight of Hand', 'Stealth'];
	const hasRemarkableAthleteBonus = hasRemarkableAthlete && remarkableAthleteSkills.includes(skillName) && !isProficient;

	if (hasExpertise) return 2;
	if (isProficient) return 1;
	if (hasHalfProficiency || hasRemarkableAthleteBonus) return 0.5;
	return 0;
}

function getSavingThrowProficiencyValue(saveName) {
	if (!currentCharacter.savingThrows) return 0;
	return currentCharacter.savingThrows[saveName] ? 1 : 0;
}

function getWeaponProficiencies() {
	const weapons = [];
	if (currentCharacter.equipmentProficiencies && currentCharacter.equipmentProficiencies.weapons) {
		weapons.push(...currentCharacter.equipmentProficiencies.weapons);
	}
	if (currentCharacter.weaponProficiencies) {
		weapons.push(...currentCharacter.weaponProficiencies);
	}
	return [...new Set(weapons)];
}

function getArmorProficiencies() {
	const armor = [];
	if (currentCharacter.equipmentProficiencies && currentCharacter.equipmentProficiencies.armor) {
		armor.push(...currentCharacter.equipmentProficiencies.armor);
	}
	if (currentCharacter.armorProficiencies) {
		armor.push(...currentCharacter.armorProficiencies);
	}
	return [...new Set(armor)];
}

function getToolProficiencies() {
	const tools = [];
	if (currentCharacter.equipmentProficiencies && currentCharacter.equipmentProficiencies.tools) {
		tools.push(...currentCharacter.equipmentProficiencies.tools);
	}
	if (currentCharacter.tools && currentCharacter.tools.proficiencies) {
		tools.push(...currentCharacter.tools.proficiencies);
	}
	if (currentCharacter.toolProficiencies) {
		tools.push(...currentCharacter.toolProficiencies);
	}
	return [...new Set(tools)];
}

function collectGroupTraitsData() {
	const groupedTraits = [];

	if (typeof saveClassesData !== 'undefined' && Object.keys(saveClassesData).length > 0) {
		const classKey = Object.keys(saveClassesData)[0];
		const classData = saveClassesData[classKey];
		if (classData && classData.traits && classData.traits.length > 0) {
			const className = classData.basicInfo?.className || currentCharacter.class || 'Unknown';
			groupedTraits.push({
				"group-title": `${className} Class Traits`,
				"group-chevron": false,
				"traits": classData.traits
			});
		}
	}

	if (typeof saveRacesData !== 'undefined' && Object.keys(saveRacesData).length > 0) {
		const raceKey = Object.keys(saveRacesData)[0];
		const raceData = saveRacesData[raceKey];
		if (raceData && raceData.traits && raceData.traits.length > 0) {
			groupedTraits.push({
				"group-title": "Racial Traits",
				"group-chevron": false,
				"traits": raceData.traits
			});
		}
	}

	return groupedTraits;
}

function getTotalAbilityScore(ability) {
	return (currentCharacter.abilities[ability] || 0) + (currentCharacter.abilityBonuses?.[ability] || 0);
}
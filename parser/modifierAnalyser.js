/**
 * Extract modifiers.
 *
 * This files contains all necessary classes to extract information about a modifier.
 * A modifier extract implements all methods from ModifierExtractor, so it extends the class.
 *
 *
 * @file   This files defines the Modifierextractor,ListmodifierExtractor, ModifierAnalyser class.
 * @author Ellen Vanhove.
 */


/*
* category: one of [MyBlock Variables]
* list: true or false
* */

import {CATEGORY as CATEGORY} from "./typeConfig";

class ModifierExtractor {

    /**
     * analyse the modifier token and return whether it contains a certain key
     * @param modifierToken
     * return {boolean} the modifier token contains the key
     */
    containsKey(modifierToken) {
        throw new Error('You have to implement the method containsKey!');
    }

    /**
     * return the name of the parameters that are set by this modifier
     */
    getName() {
        throw new Error('You have to implement the method getName!');
    }

    addParameters(obj,modifierToken) {
        throw new Error('You have to implement the method addParameters!');
    }
}

const CATEGORY_KEY = "category";

class listModifierExtractor extends ModifierExtractor {
    containsKey(modifierToken) {
        return modifierToken.image.match(/::list/i);
    }

    getName() {
        return CATEGORY_KEY;
    }

    addParameters(obj,modifierToken) {
        obj["list"]=true;
        obj[CATEGORY_KEY] = CATEGORY.VARIABLES;
    }
}

class myBlockModifierExtractor extends ModifierExtractor {
    containsKey(modifierToken) { //best practice: ::My Blocks
        return modifierToken.image.match(/^::local$/i)
            || modifierToken.image.match(/^::my[ \t]*blocks?/i)
            || modifierToken.image.match(/^::custom-arg$/i);
    }

    getName() {
        return CATEGORY_KEY;
    }

    addParameters(obj,modifierToken) {
        obj[CATEGORY_KEY] = CATEGORY.MYBLOCK;
    }
}

class varModifierExtractor extends ModifierExtractor {
    containsKey(modifierToken) { //best practice ::Variables
        return modifierToken.image.match(/^::user-defined$/i)
            || modifierToken.image.match(/^::custom$/i)
            || modifierToken.image.match(/^::variables?$/i);
    }

    getName() {
        return CATEGORY_KEY;
    }

    addParameters(obj,modifierToken) {
        obj[CATEGORY_KEY] = CATEGORY.VARIABLES;
    }
}

export class ModifierAnalyser {
    constructor(ctx, warningsKeeper) {
        this.warningsKeeper =warningsKeeper;
        this.modifierExtractors = [];
        this.modifierExtractors.push(new listModifierExtractor());
        this.modifierExtractors.push(new myBlockModifierExtractor());
        this.modifierExtractors.push(new varModifierExtractor());
    }

    getMods(ctx,modifierList) {
        let mods = {};
        /**
         * for every modifier
         *      for every modifier extractor
         *          if the modifier is present
         *              add the info generated by the modifier extractor
         *          if already info about this parameter present add a warning and ignore it
         */
        if (modifierList) {
            for (let i = 0; i < modifierList.length; i++) {
                for (let m = 0; m < this.modifierExtractors.length; m++) {
                    if (this.modifierExtractors[m].containsKey(modifierList[i])) {
                        let name = this.modifierExtractors[m].getName();
                        if(mods[name]){
                            this.warningsKeeper.add(ctx, "multiple modifiers with conflicting meaning");
                        }else {
                            //mods[name] = this.modifierExtractors[m].extractParameters(modifierList[i]);
                            this.modifierExtractors[m].addParameters(mods,modifierList[i]);
                        }
                    }
                }
            }
        }
        return mods;
    }

}
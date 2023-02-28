import {writeFile} from "node:fs"

import {readFile} from "node:fs"
import {dirname} from "node:path"

import Button from "./button.js"

import * as ui from "./ui.js"

import {Button as MainButton,Label as MainLabel} from "./main/ui.js"
import {Button as AltButton} from "./alt/ui.js"

import TheDefault,{Label,Button as TheButton} from "./main/ui.js"
import {relative} from "node:path"


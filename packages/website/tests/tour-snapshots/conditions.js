const answer=42

if(answer===42){prn("simple","boom")}else{prn("simple","no-dice")}
let hoist__0
if(answer===42){hoist__0="boom"}
prn("hoisted",hoist__0)
let hoist__1
if(answer<42){hoist__1="too-low"}else if(answer>42){hoist__1="too-high"}else if(answer===42){hoist__1="just-right"}
prn("multiple",hoist__1)
if(answer===42){prn("when",answer)
prn("when has an implicit do")
}
{let macro__1=(answer-41)
if(macro__1){{let one=macro__1
prn("when-let",one)
}}
}

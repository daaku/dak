




for(let i=40
i<43
i++){switch (i){case 41:prn(i,"warm")
break
case 42:prn(i,"boom")
break
default:prn(i,"no dice")
break}
}

const answer=42

let hoist__0
switch (answer){case 42:hoist__0="boom"
break
default:hoist__0="no dice"
break}
prn("hoisted",hoist__0)

const run=(answer)=>{switch (answer){case 41:return "warm"
case 42:return "boom"
default:return "no dice"
}
}
prn("run returns",run(42))

let hoist__1
switch (answer){case 41:case 42:case 43:hoist__1="close-enough"
break
default:hoist__1="no dice"
break}
prn("array",hoist__1)

try{prn(neverDefined())
}catch(e){prn("caught",e.message)
}finally{prn("finally")
}
const check=(answer)=>{let hoist__0
try{switch (answer){case 42:hoist__0="boom"
break
case 41:hoist__0="close"
break
default:throw new Error("no-dice")
break}
}catch(e){hoist__0="failed"
}
return prn("check",hoist__0)
}
check(40)
check(41)
check(42)

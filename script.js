// ================== ELEMENT SELECTION ==================
let prompt = document.querySelector("#prompt")
let submitbtn = document.querySelector("#submit")
let chatContainer = document.querySelector(".chat-container")
let imagebtn = document.querySelector("#image")
let image = document.querySelector("#image img")
let imageinput = document.querySelector("#image input")

// ⚠️ WARNING: API key should be moved to backend in real projects
const Api_Url =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyB2D93Jdy1-D8sWTcw_QAOwaMx2wX28qD0"

// ================== USER DATA ==================
let user = {
  message: "",
  file: {
    mime_type: null,
    data: null
  }
}

// ================== AI RESPONSE FUNCTION ==================
async function generateResponse(aiChatBox) {
  let text = aiChatBox.querySelector(".ai-chat-area")

  const RequestOption = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: user.message },
            ...(user.file.data ? [{ inline_data: user.file }] : [])
          ]
        }
      ]
    })
  }

  try {
    const response = await fetch(Api_Url, RequestOption)

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`HTTP ${response.status} : ${errText}`)
    }

    const data = await response.json()

    if (!data?.candidates?.length) {
      throw new Error("No response from AI")
    }

    // ✅ SAFER RESPONSE HANDLING
    let apiResponse = data.candidates[0].content.parts
      .map(p => p.text || "")
      .join("")
      .trim()

    text.innerHTML = apiResponse || "(No text returned)"

    // reset file only on success
    user.file = { mime_type: null, data: null }
    image.src = "img.svg"
    image.classList.remove("choose")
  }
  catch (error) {
    console.error(error)
    text.innerHTML = `<span style="color:red">Error: ${error.message}</span>`
  }
  finally {
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth"
    })
  }
}

// ================== CHAT BOX CREATOR ==================
function createChatBox(html, classes) {
  let div = document.createElement("div")
  div.innerHTML = html
  div.classList.add(classes)
  return div
}

// ================== USER MESSAGE HANDLER ==================
function handlechatResponse(userMessage) {
  if (!userMessage.trim()) return   // ❌ prevent empty messages

  user.message = userMessage.trim()

  let html = `
    <img src="user.png" width="8%">
    <div class="user-chat-area">
      ${escapeHtml(user.message)}
      ${
        user.file.data
          ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg">`
          : ""
      }
    </div>
  `

  prompt.value = ""
  chatContainer.appendChild(createChatBox(html, "user-chat-box"))

  setTimeout(() => {
    let aiHtml = `
      <img src="ai.png" width="10%">
      <div class="ai-chat-area">
        <img src="loading.webp" width="50px">
      </div>
    `
    let aiChatBox = createChatBox(aiHtml, "ai-chat-box")
    chatContainer.appendChild(aiChatBox)
    generateResponse(aiChatBox)
  }, 500)
}

// ================== HTML ESCAPE (XSS SAFE) ==================
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c])
}

// ================== EVENTS ==================
prompt.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault()
    handlechatResponse(prompt.value)
  }
})

submitbtn.addEventListener("click", () => {
  handlechatResponse(prompt.value)
})

// ================== IMAGE UPLOAD ==================
imageinput.addEventListener("change", () => {
  const file = imageinput.files[0]
  if (!file) return

  // ✅ validate file
  if (!file.type.startsWith("image/")) {
    alert("Only image files allowed")
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    alert("Image must be under 2MB")
    return
  }

  const reader = new FileReader()
  reader.onload = e => {
    user.file = {
      mime_type: file.type,
      data: e.target.result.split(",")[1]
    }
    image.src = e.target.result
    image.classList.add("choose")
  }
  reader.readAsDataURL(file)
})

imagebtn.addEventListener("click", () => {
  imageinput.click()
})

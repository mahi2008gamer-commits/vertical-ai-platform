
import streamlit as st

st.set_page_config(
    page_title="Vertical AI Platform",
    page_icon="🤖",
    layout="wide"
)

# Platform heading
st.title("🤖 Vertical AI Platform")

st.write(
    "Your AI Agents for Every Industry"
)

st.divider()

# Sidebar
st.sidebar.title("Navigation")

page = st.sidebar.radio(
    "Select Page",
    ["Dashboard", "AI Agents", "My Agents", "Profile"]
)

if page == "Dashboard":

    st.header("Welcome to your AI Dashboard")

    st.write(
        "Explore specialized AI agents "
        "for different industries."
    )

    col1, col2, col3 = st.columns(3)

    col1.metric("Industries", "6")
    col2.metric("AI Agents", "12")
    col3.metric("My Agents", "0")

    st.divider()

    st.subheader("Choose Your Industry")

    industry = st.selectbox(
        "Select an Industry",
        [
            "Agriculture",
            "Healthcare",
            "Banking",
            "Education",
            "Manufacturing",
            "Retail"
        ]
    )

    st.write("Selected Industry:", industry)

    st.subheader("Choose Your AI Agent")

    agent = st.selectbox(
        "Select an Agent",
        [
            "Business Assistant",
            "Customer Support Agent",
            "Data Analysis Agent"
        ]
    )

    st.write("Selected Agent:", agent)

    st.subheader("Ask Your AI Agent")

    question = st.text_area(
        "Enter your question",
        placeholder="Type your question here..."
    )

    if st.button("Submit Question"):

        if question.strip():

            st.info(
                "Your question is ready. "
                "Connect the backend API to receive "
                "a real AI response."
            )

            st.write("Industry:", industry)
            st.write("Agent:", agent)
            st.write("Question:", question)

        else:
            st.warning("Please enter a question.")

elif page == "AI Agents":

    st.header("AI Agent Marketplace")

    st.write("Explore available AI agents.")

elif page == "My Agents":

    st.header("My Custom AI Agents")

    st.write("Your created agents will appear here.")

elif page == "Profile":

    st.header("User Profile")

    st.write("Profile settings will appear here.")

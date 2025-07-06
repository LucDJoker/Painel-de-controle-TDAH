package com.painelcontrole.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class WidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
            // Aqui você pode buscar as tarefas do dia e atualizar a lista
            // Exemplo estático:
            views.setTextViewText(R.id.widget_tarefas, "- Tarefa 1\n- Tarefa 2\n- Tarefa 3");
            // Adicionar ação de confirmar (exemplo: abrir o app)
            Intent intent = new Intent(context, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_confirmar, pendingIntent);
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
} 